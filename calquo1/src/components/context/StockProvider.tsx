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

  // Load all stock data - simplified background approach
  const loadAllStock = async () => {
    const operationId = `loadAllStock_${Date.now()}`;
    performanceTracker.startOperation(operationId, 'Load All Stock Data');

    try {
      setError(null);

      // Try to load API data with short timeout (only if online)
      if (navigator.onLine) {
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
            // Direct API response
            stocks = data;
          }

          // DEBUG: Log the raw stock data
          console.log('🔥 RAW FIREBASE STOCK DATA:', stocks.length > 0 ? stocks[0] : 'No stocks');
          if (stocks.length > 0) {
            console.log('🔥 FIRST STOCK ITEM FIELDS:', Object.keys(stocks[0]));
            console.log('🔥 FIRST STOCK basePrice:', stocks[0].basePrice);
            console.log('🔥 FIRST STOCK singleShopPrice:', stocks[0].singleShopPrice);
            console.log('🔥 FIRST STOCK multiShopPrice:', stocks[0].multiShopPrice);
          }

          clearTimeout(timeoutId);

          if (stocks.length > 0) {
            const apiStocks = createDisplayReadyStock(stocks);
            setAllStock(apiStocks);

            // Cache successful response
            try {
              localStorage.setItem('allStock_cache', JSON.stringify(apiStocks));
              localStorage.setItem('allStock_cache_timestamp', Date.now().toString());
            } catch (cacheError) {
              // Silent cache failure
            }

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
                if (process.env.NODE_ENV === 'development') {
                  console.log('Using cached stock data');
                }
              }
            } catch (e) {
              // Silent cache failure
            }
          }

          // Log API error only in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Stock API failed, using fallback data:', apiError);
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in loadAllStock:', error);
      }
    } finally {
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

      // Start with empty user stock
      setUserStock([]);

      // Try to load API data in background with timeout (only if online)
      if (navigator.onLine) {
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
            } catch (cacheError) {
              // Silent cache failure
              if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to cache user stock data:', cacheError);
              }
            }

            if (process.env.NODE_ENV === 'development') {
              console.log(`Loaded ${displayReadyUserStocks.length} stock items for user: ${user.company}`);
            }
          }
        } catch (apiError) {
          // Check for cached data as fallback
          const cached = localStorage.getItem(`userStock_${user.company}`);
          const cacheTimestamp = localStorage.getItem(`userStock_${user.company}_timestamp`);
          const isRecentCache = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 6 * 60 * 60 * 1000; // 6 hours

          if (cached && isRecentCache) {
            try {
              const cachedStocks = JSON.parse(cached);
              setUserStock(cachedStocks);
              if (process.env.NODE_ENV === 'development') {
                console.log('Using cached user stock data');
              }
            } catch (e) {
              // Silent cache parse failure
              if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to parse cached user stock data');
              }
            }
          }
          // If no cache or API fails, user stock stays empty (which is fine for demo)
        }
      } else {
        // Offline - try cached user stock data
        const cached = localStorage.getItem(`userStock_${user.company}`);
        const cacheTimestamp = localStorage.getItem(`userStock_${user.company}_timestamp`);
        const isRecentCache = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 6 * 60 * 60 * 1000;

        if (cached && isRecentCache) {
          try {
            const cachedStocks = JSON.parse(cached);
            setUserStock(cachedStocks);
            if (process.env.NODE_ENV === 'development') {
              console.log('Using cached user stock data (offline)');
            }
          } catch (e) {
            // Silent failure - user stock stays empty
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to parse cached user stock data while offline');
            }
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in loadUserStock:', error);
      }
      // Keep empty user stock for demo - don't set error
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

  // Add new stock item
  const addStock = async (stockData: any): Promise<boolean> => {
    try {
      console.log('📦 [StockProvider] Adding stock item:', stockData.name);
      const response = await stockAPI.addStock(stockData);

      if (response.success || response.usingFallback) {
        // Process new stock item to prioritize user-uploaded images
        const rawNewStock = response.stock || stockData;
        
        // If response.stock is missing but success is true, it might be the Supabase shim
        // which already added it. We'll use the stockData as a base.
        if (!response.stock && response.success) {
           console.log('ℹ️ [StockProvider] Response successful but missing stock object, using input data');
        }

        const processedNewStock = createDisplayReadyStock([rawNewStock])[0];

        if (processedNewStock) {
          // Add to local state immediately for better UX
          setAllStock(prev => [processedNewStock, ...prev]);

          // If it's the current user's stock, add to userStock as well
          if (user?.company === processedNewStock.supplier) {
            setUserStock(prev => [processedNewStock, ...prev]);
          }

          // Log if this item has user-uploaded images
          if (process.env.NODE_ENV === 'development' && hasUserUploadedImages(processedNewStock)) {
            console.log('Added new stock item with user images:');
            logImagePrioritization(processedNewStock);
          }
        }

        toast.success('Stock item added successfully!');
        return true;
      } else {
        // Fallback for Supabase environment - directly add to collection
        console.warn('⚠️ [StockProvider] API failed, attempting direct Supabase insert fallback...');
        try {
          const newId = await addDocument('stock_items', stockData);
          if (newId) {
            const fallbackStock = { ...stockData, id: newId };
            const processedFallback = createDisplayReadyStock([fallbackStock])[0];
            
            setAllStock(prev => [processedFallback, ...prev]);
            if (user?.company === processedFallback.supplier) {
              setUserStock(prev => [processedFallback, ...prev]);
            }
            
            toast.success('Stock item added successfully (via Supabase)!');
            return true;
          }
        } catch (dbError) {
          console.error('❌ [StockProvider] Fallback insert failed:', dbError);
        }
        
        toast.error(response.error || 'Failed to add stock item');
        return false;
      }
    } catch (error) {
      console.error('Error adding stock:', error);

      // Check for timeout error
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to add stock item. Please try again.');
      }
      return false;
    }
  };

  // Update stock item
  const updateStock = async (stockId: string, updates: any): Promise<boolean> => {
    try {
      const response = await stockAPI.updateStock(stockId, updates);

      if (response.success) {
        // Process updated stock item to prioritize user-uploaded images
        const rawUpdatedStock = response.stock;
        const processedUpdatedStock = createDisplayReadyStock([rawUpdatedStock])[0];

        // Update in allStock
        setAllStock(prev => prev.map(stock =>
          stock.id === stockId ? processedUpdatedStock : stock
        ));

        // Update in userStock if applicable
        setUserStock(prev => prev.map(stock =>
          stock.id === stockId ? processedUpdatedStock : stock
        ));

        // Log if this updated item has user-uploaded images
        if (process.env.NODE_ENV === 'development' && hasUserUploadedImages(processedUpdatedStock)) {
          console.log('Updated stock item with user images:');
          logImagePrioritization(processedUpdatedStock);
        }

        toast.success('Stock item updated successfully!');
        return true;
      } else {
        toast.error(response.error || 'Failed to update stock item');
        return false;
      }
    } catch (error) {
      console.error('Error updating stock:', error);

      // Check for timeout error
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to update stock item. Please try again.');
      }
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

          const transformedStock = data.map((item: any) => ({
            ...item,
            dateAdded: item.created_at ? new Date(item.created_at) : new Date(),
            supplier: item.supplier || item.company_name || 'Unknown',
            location: item.location || 'India',
            category: item.category || 'Apparel',
            name: item.name || 'Unnamed Product',
            basePrice: Number(item.base_price || item.basePrice || 0),
            retailerPrice: Number(item.retailer_price || item.retailerPrice || 0),
            dealerPrice: Number(item.dealer_price || item.dealerPrice || 0),
            minOrderQuantity: Number(item.min_order_quantity || item.minOrderQuantity || 1),
            colors: item.colors || [],
            sizes: item.sizes || [],
            combinations: item.combinations || [],
            mainImages: item.main_images || item.mainImages || [],
            status: item.status || 'active',
            itemSetType: item.item_set_type || item.itemSetType || 'individual_flex',
          }));

          setAllStock(transformedStock as EnhancedStockItem[]);
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
      [where('gst_number', '==', user.id), where('status', '==', 'active')],
      (data) => {
        const transformed = data.map((item: any) => ({
          ...item,
          dateAdded: item.created_at ? new Date(item.created_at) : new Date(),
          supplier: item.supplier || 'Unknown',
          location: item.location || 'India',
        }));
        setUserStock(transformed as EnhancedStockItem[]);
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
