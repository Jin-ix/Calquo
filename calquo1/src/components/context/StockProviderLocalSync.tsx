/**
 * LOCAL SYNC VERSION OF STOCK PROVIDER
 * For demo/testing without Firebase
 * Simulates real-time updates using localStorage and events
 * Updated: 2025-11-09 14:35 - Using shared StockContext
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { EnhancedStockItem } from '../stock/EnhancedStockTypes';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { getDemoStockResponse } from '../stock/DemoStockData';
import { StockContext, StockContextType, useStock } from './StockContext';

// Re-export useStock for backward compatibility
export { useStock };

interface StockProviderProps {
  children: ReactNode;
}

// Custom event for local sync
const STOCK_UPDATE_EVENT = 'calico-stock-update';

export function StockProviderLocalSync({ children }: StockProviderProps) {
  const { user } = useAuth();
  
  // Initialize with demo data and any saved local stock
  const [allStock, setAllStock] = useState<EnhancedStockItem[]>(() => {
    try {
      const demoResponse = getDemoStockResponse();
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      console.log('📦 Initialized with', demoResponse.stocks.length, 'demo items +', localStock.length, 'local items');
      
      // Merge demo and local stock
      return [...localStock, ...demoResponse.stocks];
    } catch (error) {
      console.error('Failed to initialize stock:', error);
      return getDemoStockResponse().stocks;
    }
  });
  
  const [userStock, setUserStock] = useState<EnhancedStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [isFirebaseSync] = useState(false); // Local sync, not Firebase

  // Update user stock when user or allStock changes
  useEffect(() => {
    if (!user?.id) {
      setUserStock([]);
      return;
    }

    // Filter allStock for current user's items
    const myStock = allStock.filter(stock => 
      stock.supplier === user.company || 
      stock.seller_company === user.company ||
      stock.sellerId === user.id
    );
    
    console.log('📦 User stock filtered:', myStock.length, 'items for', user.company);
    setUserStock(myStock);
  }, [user, allStock]);

  // Listen for local storage updates from other tabs/components
  useEffect(() => {
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'calico_local_stock') {
        console.log('📦 Stock updated in another tab, refreshing...');
        const localStockStr = e.newValue;
        if (localStockStr) {
          const localStock = JSON.parse(localStockStr);
          const demoResponse = getDemoStockResponse();
          setAllStock([...localStock, ...demoResponse.stocks]);
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // Listen for custom stock update events (same tab)
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log('📦 Stock update event received, refreshing...');
      const localStockStr = localStorage.getItem('calico_local_stock');
      if (localStockStr) {
        const localStock = JSON.parse(localStockStr);
        const demoResponse = getDemoStockResponse();
        setAllStock([...localStock, ...demoResponse.stocks]);
      }
    };

    window.addEventListener(STOCK_UPDATE_EVENT, handleStockUpdate);
    return () => window.removeEventListener(STOCK_UPDATE_EVENT, handleStockUpdate);
  }, []);

  const refreshStock = async () => {
    console.log('📦 Refreshing stock...');
    const localStockStr = localStorage.getItem('calico_local_stock');
    const localStock = localStockStr ? JSON.parse(localStockStr) : [];
    const demoResponse = getDemoStockResponse();
    setAllStock([...localStock, ...demoResponse.stocks]);
  };

  const addStock = async (stockData: any): Promise<boolean> => {
    try {
      console.log('📦 Adding stock locally:', stockData);
      
      // Create new stock item with ID and timestamp
      const newStock: EnhancedStockItem = {
        ...stockData,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date(),
        createdAt: new Date(),
        status: 'active',
        supplier: user?.company || stockData.supplier || 'Demo Company',
        seller_company: user?.company || stockData.supplier,
        sellerId: user?.id || 'demo_seller'
      };

      // Get existing local stock
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      // Add new item to beginning
      const updatedLocalStock = [newStock, ...localStock];
      
      // Save to localStorage
      localStorage.setItem('calico_local_stock', JSON.stringify(updatedLocalStock));
      
      // Update state immediately
      const demoResponse = getDemoStockResponse();
      setAllStock([...updatedLocalStock, ...demoResponse.stocks]);
      
      // Trigger event for other components
      window.dispatchEvent(new Event(STOCK_UPDATE_EVENT));
      
      console.log('✅ Stock added locally, total local items:', updatedLocalStock.length);
      toast.success('Stock added successfully! 🎉');
      return true;
    } catch (error) {
      console.error('❌ Error adding stock:', error);
      toast.error('Failed to add stock. Please try again.');
      return false;
    }
  };

  const updateStock = async (stockId: string, updates: any): Promise<boolean> => {
    try {
      console.log('📦 Updating stock locally:', stockId);
      
      // Get existing local stock
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      // Update the item
      const updatedLocalStock = localStock.map((item: EnhancedStockItem) =>
        item.id === stockId ? { ...item, ...updates } : item
      );
      
      // Save to localStorage
      localStorage.setItem('calico_local_stock', JSON.stringify(updatedLocalStock));
      
      // Update state
      const demoResponse = getDemoStockResponse();
      setAllStock([...updatedLocalStock, ...demoResponse.stocks]);
      
      // Trigger event
      window.dispatchEvent(new Event(STOCK_UPDATE_EVENT));
      
      toast.success('Stock updated successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      toast.error('Failed to update stock. Please try again.');
      return false;
    }
  };

  const deleteStock = async (stockId: string): Promise<boolean> => {
    try {
      console.log('📦 Deleting stock locally:', stockId);
      
      // Get existing local stock
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      // Remove the item
      const updatedLocalStock = localStock.filter((item: EnhancedStockItem) => item.id !== stockId);
      
      // Save to localStorage
      localStorage.setItem('calico_local_stock', JSON.stringify(updatedLocalStock));
      
      // Update state
      const demoResponse = getDemoStockResponse();
      setAllStock([...updatedLocalStock, ...demoResponse.stocks]);
      
      // Trigger event
      window.dispatchEvent(new Event(STOCK_UPDATE_EVENT));
      
      toast.success('Stock deleted successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error deleting stock:', error);
      toast.error('Failed to delete stock. Please try again.');
      return false;
    }
  };

  const bulkDeleteStock = async (stockIds: string[]): Promise<boolean> => {
    try {
      console.log('📦 Bulk deleting stock locally:', stockIds);
      
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      const updatedLocalStock = localStock.filter((item: EnhancedStockItem) => !stockIds.includes(item.id));
      
      localStorage.setItem('calico_local_stock', JSON.stringify(updatedLocalStock));
      
      const demoResponse = getDemoStockResponse();
      setAllStock([...updatedLocalStock, ...demoResponse.stocks]);
      
      window.dispatchEvent(new Event(STOCK_UPDATE_EVENT));
      
      toast.success(`${stockIds.length} items deleted successfully!`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting stock:', error);
      toast.error('Failed to delete stock. Please try again.');
      return false;
    }
  };

  const bulkUpdateStockStatus = async (stockIds: string[], status: 'active' | 'inactive' | 'draft'): Promise<boolean> => {
    try {
      console.log('📦 Bulk updating stock status locally:', stockIds, status);
      
      const localStockStr = localStorage.getItem('calico_local_stock');
      const localStock = localStockStr ? JSON.parse(localStockStr) : [];
      
      const updatedLocalStock = localStock.map((item: EnhancedStockItem) => 
        stockIds.includes(item.id) ? { ...item, status } : item
      );
      
      localStorage.setItem('calico_local_stock', JSON.stringify(updatedLocalStock));
      
      const demoResponse = getDemoStockResponse();
      setAllStock([...updatedLocalStock, ...demoResponse.stocks]);
      
      window.dispatchEvent(new Event(STOCK_UPDATE_EVENT));
      
      toast.success(`${stockIds.length} items updated to ${status}!`);
      return true;
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      toast.error('Failed to update stock. Please try again.');
      return false;
    }
  };

  return (
    <StockContext.Provider
      value={{
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
      }}
    >
      {children}
    </StockContext.Provider>
  );
}
