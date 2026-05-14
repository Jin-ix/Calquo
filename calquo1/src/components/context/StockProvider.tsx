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
      variants: dbItem.variants || [],
      variantGroups: dbItem.variant_groups || [],
      combinations: dbItem.combinations || [],
      colors: dbItem.colors || [],
      sizes: dbItem.sizes || [],
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
    console.log('🔍 [StockProvider] Mapping item to Supabase. Source price:', item.price, 'Source qty:', item.quantity);
    const mapped: any = {};
    
    // Mapping rules: if camelCase exists, map to snake_case. 
    // If snake_case already exists, keep it.
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
      retailer_price: 'retailer_price', // Handle already mapped
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
      variant_groups: 'variant_groups',
      combinations: 'combinations',
      colors: 'colors',
      sizes: 'sizes',
      images: ['images', 'main_images'],
      productImages: ['images', 'main_images'],
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
      supplierType: 'supplier_type',
      location: 'location',
      unitMode: 'unit_mode',
      bulkSellingMode: 'bulk_selling_mode',
      status: 'status',
      gstNumber: 'gst_number'
    };

    // Apply mapping
    Object.keys(item).forEach(key => {
      const target = mapping[key];
      let value = item[key];
      
      // Convert numeric fields if they are strings or falsy
      if (['price', 'basePrice', 'piecePrice', 'mrp', 'mrpPerPiece', 'singleShopPrice', 'multiShopPrice', 'dealerPrice', 'retailerPrice', 'retailer_price', 'offerPrice', 'quantity', 'minOrderQuantity'].includes(key)) {
        if (value === null || value === undefined || value === '') {
          value = 0;
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value);
          value = isNaN(parsed) ? 0 : parsed;
        } else if (typeof value === 'number' && isNaN(value)) {
          value = 0;
        }
      }

      if (target) {
        if (Array.isArray(target)) {
          target.forEach(t => { mapped[t] = value; });
        } else {
          mapped[target] = value;
        }
      } else {
        // Keep unknown keys as is (might be already snake_case)
        mapped[key] = value;
      }
    });

    // Special handling for nested offerData from AppMain
    if (item.offerData) {
      if (item.offerData.offerPrice) mapped.offer_price = parseFloat(item.offerData.offerPrice) || 0;
      if (item.offerData.offerType) mapped.offer_type = item.offerData.offerType;
      if (item.offerData.offerTimeWeeks) mapped.offer_time_weeks = parseInt(item.offerData.offerTimeWeeks) || null;
      if (item.offerData.offerMinQuantity) mapped.offer_min_quantity = parseInt(item.offerData.offerMinQuantity) || null;
    }

    // Defaults for mandatory-ish fields
    if (mapped.quantity === undefined || mapped.quantity === null || isNaN(mapped.quantity)) {
      mapped.quantity = 0;
    }
    if (typeof mapped.quantity === 'string') {
      mapped.quantity = parseInt(mapped.quantity) || 0;
    }

    // FALLBACK LOGIC: If base_price is 0 or missing, try to steal it from other pricing fields
    const priceFields = ['base_price', 'single_shop_price', 'multi_shop_price', 'retailer_price', 'dealer_price'];
    let finalBasePrice = 0;
    for (const field of priceFields) {
      const val = parseFloat(mapped[field]);
      if (!isNaN(val) && val > 0) {
        finalBasePrice = val;
        break;
      }
    }
    mapped.base_price = finalBasePrice;
    
    if (mapped.status === undefined) mapped.status = 'active';
    
    console.log('✅ [StockProvider] Mapping complete. Final base_price:', mapped.base_price, 'Final quantity:', mapped.quantity);
    return mapped;
  };

  // Add new stock item
  const addStock = async (stockData: any): Promise<boolean> => {
    try {
      console.log('📦 [StockProvider] Adding stock item:', stockData.name);
      
      const supabasePayload = mapStockToSupabase(stockData);
      console.log('🚀 [StockProvider] Final Supabase Payload:', JSON.stringify(supabasePayload, null, 2));

      // Attempt via API first
      console.log('📡 [StockProvider] Calling stockAPI.addStock...');
      const response = await stockAPI.addStock(supabasePayload);
      console.log('📥 [StockProvider] API Response:', response);

      if (response.success) {
        const rawNewStock = response.stock || supabasePayload;
        const processedNewStock = createDisplayReadyStock([rawNewStock])[0];

        if (processedNewStock) {
          setAllStock(prev => [processedNewStock, ...prev]);
          if (user?.company === processedNewStock.supplier) {
            setUserStock(prev => [processedNewStock, ...prev]);
          }
        }

        toast.success('Stock item added successfully!');
        return true;
      } else {
        // Direct Supabase insert fallback
        console.log('ℹ️ [StockProvider] API failed, using direct Supabase insert...');
        const newId = await addDocument('stock_items', supabasePayload);
        console.log('🆔 [StockProvider] Direct insert result (newId):', newId);
        
        if (newId) {
          const fallbackStock = { ...supabasePayload, id: newId };
          const processedFallback = createDisplayReadyStock([fallbackStock])[0];
          
          setAllStock(prev => [processedFallback, ...prev]);
          if (user?.company === processedFallback.supplier) {
            setUserStock(prev => [processedFallback, ...prev]);
          }
          
          toast.success('Stock item added successfully!');
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock item.');
      return false;
    }
  };

  // Update stock item
  const updateStock = async (stockId: string, updates: any): Promise<boolean> => {
    try {
      console.log('🔄 [StockProvider] Updating stock item:', stockId);
      const mappedUpdates = mapStockToSupabase(updates);
      
      const response = await stockAPI.updateStock(stockId, mappedUpdates);

      if (response.success) {
        const rawUpdatedStock = response.stock || { ...updates, id: stockId };
        const processedUpdatedStock = createDisplayReadyStock([rawUpdatedStock])[0];

        setAllStock(prev => prev.map(stock => stock.id === stockId ? processedUpdatedStock : stock));
        setUserStock(prev => prev.map(stock => stock.id === stockId ? processedUpdatedStock : stock));

        toast.success('Stock item updated successfully!');
        return true;
      } else {
        // Fallback: Direct Supabase update
        console.log('ℹ️ [StockProvider] API failed, using direct Supabase update...');
        const { updateDocument } = await import('../../utils/firebase/firestore');
        const success = await updateDocument('stock_items', stockId, mappedUpdates);
        
        if (success) {
           // Reload or update state
           refreshStock();
           toast.success('Stock item updated successfully!');
           return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock item.');
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
