/**
 * Stock Context Interface
 * 
 * This is the single source of truth for the Stock context in CALIQUO.
 * All stock providers (Firebase, LocalSync, and Fallback) use this same context.
 * 
 * ARCHITECTURE:
 * - StockContext.tsx (this file): Defines the context and useStock hook
 * - StockProvider.tsx: Firebase real-time sync implementation
 * - StockProviderLocalSync.tsx: LocalStorage-based sync for demo mode
 * - StockProviderSafe.tsx: Wrapper that selects the appropriate provider
 *   - Also includes FallbackStockProvider for error recovery
 * 
 * CRITICAL: All providers MUST use this shared StockContext to ensure
 * the useStock hook works correctly regardless of which provider is active.
 * 
 * Updated: 2025-11-09 14:35 - Fixed context sharing across all providers
 */

import { createContext, useContext } from 'react';
import { EnhancedStockItem } from '../stock/EnhancedStockTypes';

export interface StockContextType {
  allStock: EnhancedStockItem[];
  userStock: EnhancedStockItem[];
  isLoading: boolean;
  backgroundLoading: boolean;
  error: string | null;
  refreshStock: () => Promise<void>;
  addStock: (stockData: any) => Promise<boolean>;
  updateStock: (stockId: string, updates: any) => Promise<boolean>;
  deleteStock: (stockId: string) => Promise<boolean>;
  // Bulk operations
  bulkDeleteStock: (stockIds: string[]) => Promise<boolean>;
  bulkUpdateStockStatus: (stockIds: string[], status: 'active' | 'inactive' | 'draft') => Promise<boolean>;
  // Firebase real-time sync status
  isFirebaseSync: boolean;
}

export const StockContext = createContext<StockContextType | undefined>(undefined);

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    // Log helpful debugging information
    console.error('❌ useStock called outside of StockProvider!');
    console.error('Component tree must include: StockProviderSafe > (StockProvider | StockProviderLocalSync | FallbackStockProvider)');
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
