// Updated: 2025-11-09 14:35 - Using shared StockContext
import React, { useState, useEffect, ReactNode } from 'react';
import { EnhancedStockItem } from '../stock/EnhancedStockTypes';
import { stockAPI } from '../../utils/api';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { createDisplayReadyStock, logImagePrioritization, hasUserUploadedImages } from '../../utils/imageUtils';
import { getDemoStockResponse } from '../stock/DemoStockData';
import { performanceTracker } from '../utils/performance-tracker';
import { listenToCollection, addDocument, where, orderBy, limit } from '../../utils/firebase/firestore';
import { StockContext, StockContextType, useStock } from './StockContext';
import { supabase } from '../../utils/supabase/client';

// Re-export useStock for backward compatibility
export { useStock };

interface StockProviderProps {
  children: ReactNode;
}

export function StockProvider({ children }: StockProviderProps) {
  const { user } = useAuth();

  // Start with empty stock - wait for Firebase data
  const [allStock, setAllStock] = useState<EnhancedStockItem[]>([]);
  const [userStock, setUserStock] = useState<EnhancedStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [isFirebaseSync, setIsFirebaseSync] = useState(false);

  // Emergency timeout to prevent hanging
  useEffect(() => {
    // Try to load from cache immediately to unblock UI if available
    const cached = localStorage.getItem('allStock_cache');
    if (cached && isLoading) {
      try {
        const cachedStocks = JSON.parse(cached);
        if (cachedStocks && cachedStocks.length > 0) {
          console.log('StockProvider: Loading from cache to prevent blocking');
          setAllStock(cachedStocks);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('StockProvider: Failed to parse cache');
      }
    }

    const emergencyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('StockProvider: Loading timeout, ensuring app is usable');
        setIsLoading(false);
        setBackgroundLoading(false);
        setError(null);
      }
    }, 10000); // 10 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [isLoading]);

  // Helper to map Supabase snake_case data back to frontend camelCase StockItem
  const mapSupabaseToStock = (dbItem: any): EnhancedStockItem => {
    const parseNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    // RECONSTRUCTION: Extract colors, sizes, and combinations from variants
    const variants = dbItem.variants || [];
    const colorsMap: Record<string, any> = {};
    const sizesMap: Record<string, any> = {};
    const combinations: any[] = [];

    if (Array.isArray(variants)) {
      variants.forEach((v: any, idx: number) => {
        const colorName = v.colorOrPattern?.name || 'Default';
        const colorValue = v.colorOrPattern?.value || '#000000';
        const colorId = `color-${colorName.toLowerCase().replace(/\s+/g, '-')}`;
        
        if (!colorsMap[colorId]) {
          colorsMap[colorId] = {
            id: colorId,
            name: colorName,
            colorCode: v.colorOrPattern?.type === 'color' ? colorValue : undefined,
            patternImage: v.colorOrPattern?.type === 'pattern' ? colorValue : (v.imageUrl || v.images?.[0]),
            images: v.images || (v.imageUrl ? [v.imageUrl] : []),
            definition: { hasColorPicker: v.colorOrPattern?.type === 'color', hasImage: !!v.imageUrl, hasName: true }
          };
        } else if (v.imageUrl || (v.images && v.images.length > 0)) {
           // Add unique images to color
           const existingImgs = colorsMap[colorId].images;
           const newImgs = v.images || (v.imageUrl ? [v.imageUrl] : []);
           colorsMap[colorId].images = Array.from(new Set([...existingImgs, ...newImgs]));
        }

        const sizeName = v.size || 'One Size';
        const sizeId = `size-${sizeName.toLowerCase().replace(/\s+/g, '-')}`;
        if (!sizesMap[sizeId]) {
          sizesMap[sizeId] = { id: sizeId, name: sizeName, displayName: sizeName };
        }

        combinations.push({
          id: `combo-${idx}`,
          colorId: colorId,
          sizeId: sizeId,
          quantity: parseInt(v.quantity) || 0,
          availableQuantity: parseInt(v.quantity) || 0,
          piecePrice: parseFloat(v.piecePrice) || parseNum(dbItem.base_price),
          mrpPerPiece: parseFloat(v.mrpPerPiece) || parseNum(dbItem.mrp),
          singleShopPrice: parseFloat(v.singleShopPrice) || parseNum(dbItem.single_shop_price),
          multiShopPrice: parseFloat(v.multiShopPrice) || parseNum(dbItem.multi_shop_price),
          dealerPrice: parseFloat(v.dealerPrice) || parseNum(dbItem.dealer_price),
          retailerPrice: parseFloat(v.retailerPrice) || parseNum(dbItem.retailer_price),
          offerPrice: parseFloat(v.offerPrice) || parseNum(dbItem.offer_price),
          images: v.images || (v.imageUrl ? [v.imageUrl] : [])
        });
      });
    }

    return {
      ...dbItem,
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      hsnCode: dbItem.hsn_code,
      description: dbItem.description,
      size: dbItem.size || 'One Size',
      color: dbItem.color || 'Default',
      quantity: parseInt(dbItem.quantity) || 0,
      price: parseNum(dbItem.base_price),
      basePrice: parseNum(dbItem.base_price),
      mrp: dbItem.mrp ? parseNum(dbItem.mrp) : undefined,
      singleShopPrice: dbItem.single_shop_price ? parseNum(dbItem.single_shop_price) : undefined,
      multiShopPrice: dbItem.multi_shop_price ? parseNum(dbItem.multi_shop_price) : undefined,
      dealerPrice: dbItem.dealer_price ? parseNum(dbItem.dealer_price) : undefined,
      retailerPrice: dbItem.retailer_price ? parseNum(dbItem.retailer_price) : undefined,
      minOrderQuantity: parseInt(dbItem.min_order_quantity) || 1,
      fabricType: dbItem.fabric_type || '',
      fabricDescription: dbItem.fabric_description || '',
      deliveryTime: dbItem.delivery_time,
      itemCode: dbItem.item_code,
      unitOfMeasure: dbItem.unit_of_measure || 'PCS',
      batchCode: dbItem.batch_code,
      itemSetType: dbItem.item_set_type || 'individual_flex',
      variants: variants,
      variantGroups: dbItem.variant_groups || [],
      combinations: combinations.length > 0 ? combinations : (dbItem.combinations || []),
      colors: Object.values(colorsMap).length > 0 ? Object.values(colorsMap) : (dbItem.colors || []),
      sizes: Object.values(sizesMap).length > 0 ? Object.values(sizesMap) : (dbItem.sizes || []),
      images: dbItem.images || [],
      productImages: dbItem.images || [],
      mainImages: dbItem.images || [],
      vtonImageUrl: dbItem.vton_image_url,
      mainImageIndex: dbItem.main_image_index || 0,
      notes: dbItem.notes,
      tradersOnly: dbItem.traders_only || false,
      selectedTraders: dbItem.selected_traders || [],
      hasOffer: dbItem.has_offer || false,
      offerPrice: dbItem.offer_price ? parseNum(dbItem.offer_price) : undefined,
      offerType: dbItem.offer_type,
      offerTimeWeeks: dbItem.offer_time_weeks ? parseInt(dbItem.offer_time_weeks) : undefined,
      offerMinQuantity: dbItem.offer_min_quantity ? parseInt(dbItem.offer_min_quantity) : undefined,
      supplier: dbItem.seller_company || dbItem.supplier || 'Unknown Supplier',
      supplierType: dbItem.supplier_type || 'manufacturer',
      location: dbItem.location || 'Mumbai',
      status: dbItem.status || 'active',
      dateAdded: dbItem.created_at || new Date().toISOString(),
    };
  };

  // Load all stock data - simplified background approach
  const loadAllStock = async () => {
    const operationId = `loadAllStock_${Date.now()}`;
    performanceTracker.startOperation(operationId, 'Load All Stock Data');

    try {
      setError(null);

      // Try to load from Supabase first (Modern approach)
      if (navigator.onLine) {
        try {
          console.log('📦 [StockProvider] Fetching all stock from Supabase...');
          const { data: dbStocks, error: dbError } = await supabase
            .from('stock_items')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbError) throw dbError;

          if (dbStocks && dbStocks.length > 0) {
            console.log(`✅ [StockProvider] Found ${dbStocks.length} items in Supabase`);
            const mappedStocks = dbStocks.map(mapSupabaseToStock);
            const displayReady = createDisplayReadyStock(mappedStocks);
            setAllStock(displayReady);
            
            // Update cache
            localStorage.setItem('allStock_cache', JSON.stringify(displayReady));
            localStorage.setItem('allStock_cache_timestamp', Date.now().toString());
            
            // If we found data in Supabase, we can stop here or proceed to Firebase sync
            if (!isFirebaseSync) {
                setIsLoading(false);
                return;
            }
          }
        } catch (supabaseErr) {
          console.warn('⚠️ Supabase fetch failed, falling back to Firebase:', supabaseErr);
        }

        // Try to load API data with short timeout (only if online and Supabase failed/empty)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 3000); // 3-second timeout

        try {
          const data = await stockAPI.getAllStock();
          let stocks = [];

          // Handle different response formats
          if (data.success && data.stocks) {
            stocks = data.stocks;
          } else if (data.data) {
            stocks = data.data;
          } else if (Array.isArray(data)) {
            stocks = data;
          }

          clearTimeout(timeoutId);

          if (stocks.length > 0) {
            const apiStocks = createDisplayReadyStock(stocks);
            setAllStock(apiStocks);

            // Cache successful response
            try {
              localStorage.setItem('allStock_cache', JSON.stringify(apiStocks));
              localStorage.setItem('allStock_cache_timestamp', Date.now().toString());
            } catch (cacheError) {}

            if (process.env.NODE_ENV === 'development') {
              console.log(`Updated with ${apiStocks.length} API stock items`);
            }
          }
        } catch (apiError) {
          clearTimeout(timeoutId);
          // Try cached data as fallback
          const cached = localStorage.getItem('allStock_cache');
          const cacheTimestamp = localStorage.getItem('allStock_cache_timestamp');
          const isRecentCache = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000;

          if (cached && isRecentCache) {
            try {
              const cachedStocks = JSON.parse(cached);
              if (cachedStocks.length > 0) {
                setAllStock(cachedStocks);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in loadAllStock:', error);
      }
    } finally {
      setIsLoading(false);
      performanceTracker.endOperation(operationId, true);
    }
  };

  // Load user's stock data - optimized approach
  const loadUserStock = async () => {
    if (!user?.company) {
      setUserStock([]);
      return;
    }

    try {
      setError(null);

      // Try Supabase first
      if (navigator.onLine) {
        try {
          console.log(`📦 [StockProvider] Fetching user stock for ${user.company} from Supabase...`);
          const { data: dbStocks, error: dbError } = await supabase
            .from('stock_items')
            .select('*')
            .eq('seller_company', user.company)
            .order('created_at', { ascending: false });

          if (dbError) throw dbError;

          if (dbStocks && dbStocks.length > 0) {
            console.log(`✅ [StockProvider] Found ${dbStocks.length} user items in Supabase`);
            const mappedStocks = dbStocks.map(mapSupabaseToStock);
            const displayReady = createDisplayReadyStock(mappedStocks);
            setUserStock(displayReady);
            
            // Cache successful response
            localStorage.setItem(`userStock_${user.company}`, JSON.stringify(displayReady));
            localStorage.setItem(`userStock_${user.company}_timestamp`, Date.now().toString());
            return; // Success, no need to fallback
          }
        } catch (supabaseErr) {
          console.warn('⚠️ Supabase user stock fetch failed:', supabaseErr);
        }

        // Try to load API data in background with timeout (Fallback)
        try {
          const response = await Promise.race([
            stockAPI.getUserStock(user.company),
            new Promise((_, reject) => setTimeout(() => reject(new Error('User stock API timeout')), 5000))
          ]);

          if (response.success) {
            const rawUserStocks = response.stocks || [];
            const displayReadyUserStocks = createDisplayReadyStock(rawUserStocks);
            setUserStock(displayReadyUserStocks);

            // Cache successful response
            try {
              localStorage.setItem(`userStock_${user.company}`, JSON.stringify(displayReadyUserStocks));
              localStorage.setItem(`userStock_${user.company}_timestamp`, Date.now().toString());
            } catch (cacheError) {}
          }
        } catch (apiError) {
          // Check for cached data as fallback
          const cached = localStorage.getItem(`userStock_${user.company}`);
          const cacheTimestamp = localStorage.getItem(`userStock_${user.company}_timestamp`);
          const isRecentCache = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 6 * 60 * 60 * 1000;

          if (cached && isRecentCache) {
            try {
              const cachedStocks = JSON.parse(cached);
              setUserStock(cachedStocks);
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in loadUserStock:', error);
      }
      setUserStock([]);
    }
  };

  // Refresh all stock data - optimized approach
  const refreshStock = async () => {
    try {
      // Load all stock (this will handle isLoading internally)
      await loadAllStock();

      // Load user stock in background if user exists
      if (user?.company) {
        loadUserStock().catch(err => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Background user stock load failed:', err);
          }
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing stock:', error);
      }
    }
  };

  // Helper to map stock data to Supabase snake_case
  const mapStockToSupabase = (item: any) => {
    console.log('🔍 [StockProvider] Mapping item to Supabase. Source:', item.name, 'Price:', item.price, 'Qty:', item.quantity);
    const mapped: any = {};
    
    // Explicit mapping to ensure backend compatibility
    const mapping: Record<string, string | string[]> = {
      name: 'name',
      category: 'category',
      hsnCode: 'hsn_code',
      description: 'description',
      size: 'size',
      color: 'color',
      quantity: 'quantity',
      price: 'base_price',
      basePrice: 'base_price',
      piecePrice: 'base_price',
      mrp: 'mrp',
      mrpPerPiece: 'mrp',
      singleShopPrice: 'single_shop_price',
      multiShopPrice: 'multi_shop_price',
      dealerPrice: 'dealer_price',
      retailerPrice: 'retailer_price',
      minOrderQuantity: 'min_order_quantity',
      fabricType: 'fabric_type',
      fabricDescription: 'fabric_description',
      deliveryTime: 'delivery_time',
      itemCode: 'item_code',
      unitOfMeasure: 'unit_of_measure',
      batchCode: 'batch_code',
      itemSetType: 'item_set_type',
      variants: 'variants',
      variantGroups: 'variant_groups',
      images: 'images',
      productImages: 'images',
      vtonImageUrl: 'vton_image_url',
      mainImageIndex: 'main_image_index',
      notes: 'notes',
      tradersOnly: 'traders_only',
      selectedTraders: 'selected_traders',
      hasOffer: 'has_offer',
      offerPrice: 'offer_price',
      offerType: 'offer_type',
      offerTimeWeeks: 'offer_time_weeks',
      offerMinQuantity: 'offer_min_quantity',
      supplier: ['supplier', 'seller_company'],
      seller_company: 'seller_company',
      sellerId: 'seller_id',
      supplierType: 'supplier_type',
      location: 'location',
      unitMode: 'unit_mode',
      bulkSellingMode: 'bulk_selling_mode',
      status: 'status',
      gstNumber: 'gst_number',
      // Include reconstructed fields for local state consistency
      combinations: 'combinations',
      colors: 'colors',
      sizes: 'sizes'
    };

    // Numeric fields that must be cast to Float/Int for PostgreSQL
    const numericFields = [
      'price', 'basePrice', 'base_price', 'piecePrice', 
      'mrp', 'mrpPerPiece', 'mrp_per_piece',
      'singleShopPrice', 'single_shop_price',
      'multiShopPrice', 'multi_shop_price',
      'dealerPrice', 'dealer_price',
      'retailerPrice', 'retailer_price',
      'offerPrice', 'offer_price',
      'quantity', 'available_quantity', 'availableQuantity',
      'minOrderQuantity', 'min_order_quantity',
      'stock', 'stock_count'
    ];

    // UUID validation - Supabase uuid columns reject non-UUID strings with a 400 error
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = (val: any) => typeof val === 'string' && UUID_REGEX.test(val);
    const UUID_FIELDS = ['id', 'user_id', 'seller_id', 'buyer_id', 'financial_agent_id', 'company_id', 'created_by', 'sellerId'];

    // Apply mapping
    Object.keys(item).forEach(key => {
      const target = mapping[key];
      let value = item[key];
      
      // Convert numeric fields if they are strings or falsy
      if (numericFields.includes(key)) {
        if (value === null || value === undefined || value === '') {
          value = 0;
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
          value = isNaN(parsed) ? 0 : parsed;
        } else if (typeof value === 'number' && isNaN(value)) {
          value = 0;
        }
      }

      // Handle UUID fields - strip if not valid format
      if (UUID_FIELDS.includes(key) || (typeof target === 'string' && UUID_FIELDS.includes(target))) {
        if (value && !isValidUUID(value)) {
          console.warn(`⚠️ [StockProvider] Stripping non-UUID value from ${key}:`, value);
          value = undefined; // Strip invalid UUID to prevent Supabase 400 error
        }
      }

      if (target) {
        if (Array.isArray(target)) {
          target.forEach(t => { mapped[t] = value; });
        } else {
          mapped[target] = value;
        }
      } else if (key.includes('_')) {
        // Keep already snake_case keys as is, but still apply numeric casting and UUID check
        mapped[key] = value;
      }
    });

    // CRITICAL: Ensure seller_company is set (this is used for filtering in My Stock)
    mapped.seller_company = item.seller_company || item.supplier || user?.company || 'Demo Company';
    if (!mapped.supplier) mapped.supplier = mapped.seller_company;

    // FALLBACK LOGIC: If base_price is 0 or missing, try to steal it from other pricing fields
    const priceFields = ['base_price', 'single_shop_price', 'multi_shop_price', 'retailer_price', 'dealer_price'];
    if (!mapped.base_price || mapped.base_price === 0) {
      for (const field of priceFields) {
        const val = parseFloat(mapped[field]);
        if (!isNaN(val) && val > 0) {
          mapped.base_price = val;
          break;
        }
      }
    }
    
    // Ensure all variants have numeric pricing/quantity
    if (mapped.variants && Array.isArray(mapped.variants)) {
      mapped.variants = mapped.variants.map((v: any) => ({
        ...v,
        quantity: parseInt(v.quantity) || 0,
        piecePrice: parseFloat(v.piecePrice) || 0,
        mrpPerPiece: parseFloat(v.mrpPerPiece) || 0,
        singleShopPrice: parseFloat(v.singleShopPrice) || 0,
        multiShopPrice: parseFloat(v.multiShopPrice) || 0,
        dealerPrice: parseFloat(v.dealerPrice) || 0,
        retailerPrice: parseFloat(v.retailerPrice) || 0,
        offerPrice: parseFloat(v.offerPrice) || 0
      }));
    }

    if (mapped.status === undefined) mapped.status = 'active';
    
    console.log('✅ [StockProvider] Mapping complete. Resulting payload:', {
      name: mapped.name,
      price: mapped.base_price,
      qty: mapped.quantity,
      seller: mapped.seller_company
    });
    return mapped;
  };

  // Add new stock item
  // Add new stock item
  const addStock = async (stockData: any): Promise<boolean> => {
    try {
      console.log('📦 [StockProvider] Starting addStock for:', stockData.name);
      
      const supabasePayload = mapStockToSupabase(stockData);
      
      // Remove any ID that might have been passed to let Supabase generate a UUID
      delete supabasePayload.id;

      console.log('🚀 [StockProvider] Inserting into Supabase...', supabasePayload.name);
      
      // Direct Supabase insert
      const { data: res, error: dbError } = await supabase
        .from('stock_items')
        .insert([{
          ...supabasePayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        console.error('❌ [StockProvider] Supabase Insert Error:', dbError.message, dbError.details);
        
        // Fallback to API if direct insert failed
        console.warn('⚠️ [StockProvider] Direct insert failed, trying API fallback...');
        const response = await stockAPI.addStock(supabasePayload);
        
        if (response.success) {
          console.log('✅ [StockProvider] Fallback API success');
          await refreshStock();
          toast.success('Product published successfully!');
          return true;
        }
        
        throw new Error(dbError.message);
      }

      if (res) {
        console.log('✅ [StockProvider] Item inserted with ID:', res.id);
        
        // Update local state for immediate UI feedback
        const mappedItem = mapSupabaseToStock(res);
        const displayReady = createDisplayReadyStock([mappedItem])[0];
        
        if (displayReady) {
          setAllStock(prev => [displayReady, ...prev]);
          if (user?.company === displayReady.supplier) {
            setUserStock(prev => [displayReady, ...prev]);
          }
        }
        
        toast.success('Product published successfully!');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('💥 [StockProvider] Fatal error adding stock:', error);
      toast.error(`Error publishing product: ${error.message || 'Check console'}`);
      return false;
    }
  };

  // Update stock item
  const updateStock = async (stockId: string, updates: any): Promise<boolean> => {
    try {
      console.log('🔄 [StockProvider] Updating stock item:', stockId);
      const mappedUpdates = mapStockToSupabase(updates);
      
      // Attempt direct Supabase update first
      const { updateDocument: directUpdate } = await import('../../utils/firebase/firestore');
      const success = await directUpdate('stock_items', stockId, mappedUpdates);

      if (success) {
        console.log('✅ [StockProvider] Item updated successfully');
        
        // Refresh local state (simplest way to ensure all derived data is correct)
        await refreshStock();
        
        toast.success('Product updated successfully!');
        return true;
      } else {
        // Fallback to API
        console.warn('⚠️ [StockProvider] Direct update failed, trying API fallback...');
        const response = await stockAPI.updateStock(stockId, mappedUpdates);
        
        if (response.success) {
          refreshStock();
          toast.success('Product updated successfully!');
          return true;
        }
      }

      toast.error('Failed to update product in database.');
      return false;
    } catch (error) {
      console.error('💥 [StockProvider] Fatal error updating stock:', error);
      toast.error('Error updating product. Check console.');
      return false;
    }
  };
  // Delete stock item
  const deleteStock = async (stockId: string): Promise<boolean> => {
    try {
      const response = await stockAPI.deleteStock(stockId);

      if (response.success) {
        // Remove from local state immediately
        setAllStock(prev => prev.filter(stock => stock.id !== stockId));
        setUserStock(prev => prev.filter(stock => stock.id !== stockId));

        toast.success('Stock item deleted successfully!');
        return true;
      } else {
        toast.error(response.error || 'Failed to delete stock item');
        return false;
      }
    } catch (error) {
      console.error('Error deleting stock:', error);

      // Check for timeout error
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete stock item. Please try again.');
      }
      return false;
    }
  };

  const bulkDeleteStock = async (stockIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase.from('stock_items').delete().in('id', stockIds);
      if (error) throw error;
      setAllStock(prev => prev.filter(item => !stockIds.includes(item.id)));
      setUserStock(prev => prev.filter(item => !stockIds.includes(item.id)));
      toast.success(`${stockIds.length} items deleted successfully`);
      return true;
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete items: ' + error.message);
      return false;
    }
  };

  const bulkUpdateStockStatus = async (stockIds: string[], status: 'active' | 'inactive' | 'draft'): Promise<boolean> => {
    try {
      const { error } = await supabase.from('stock_items').update({ status }).in('id', stockIds);
      if (error) throw error;
      setAllStock(prev => prev.map(item => stockIds.includes(item.id) ? { ...item, status } : item));
      setUserStock(prev => prev.map(item => stockIds.includes(item.id) ? { ...item, status } : item));
      toast.success(`${stockIds.length} items updated to ${status}`);
      return true;
    } catch (error: any) {
      console.error('Error in bulk update:', error);
      toast.error('Failed to update items: ' + error.message);
      return false;
    }
  };

  // Supabase Real-time Sync for All Stock (Browse Stock)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSupabaseSync = () => {
      setIsFirebaseSync(true);

      unsubscribe = listenToCollection(
        'stock_items',
        [orderBy('created_at', 'desc'), limit(100)],
        (data) => {
          if (!data || data.length === 0) {
            console.log('No stock items found in Supabase. Add items through "Add Stock" form.');
            // Only fall back to demo if we've never had real data
            if (allStock.length === 0) {
              const demoResponse = getDemoStockResponse();
              setAllStock(demoResponse.stocks);
            }
            setIsLoading(false);
            return;
          }

          const transformedStock = data.map(mapSupabaseToStock);
          setAllStock(createDisplayReadyStock(transformedStock));
          setIsLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Supabase stock listener error:', error);
          setIsLoading(false);
        }
      );
    };

    setupSupabaseSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Supabase Real-time Sync for User Stock (My Stock)
  useEffect(() => {
    if (!user?.id) {
      setUserStock([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    unsubscribe = listenToCollection(
      'stock_items',
      [
        where('seller_company', '==', user.company), 
        where('status', '==', 'active'),
        orderBy('created_at', 'desc')
      ],
      (data) => {
        const transformed = data.map(mapSupabaseToStock);
        setUserStock(createDisplayReadyStock(transformed));
      }
    );

    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);


  const value: StockContextType = {
    allStock,
    userStock,
    isLoading,
    backgroundLoading,
    error,
    refreshStock,
    addStock,
    updateStock,
    deleteStock,
    bulkDeleteStock,
    bulkUpdateStockStatus,
    isFirebaseSync
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}
