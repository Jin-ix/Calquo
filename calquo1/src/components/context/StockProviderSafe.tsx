// Updated: 2025-11-09 14:35 - FallbackStockProvider now uses shared StockContext
import React, { ReactNode, useEffect, useState } from 'react';
import { StockProvider } from './StockProvider';
import { StockProviderLocalSync } from './StockProviderLocalSync';
import { getDemoStockResponse } from '../stock/DemoStockData';
import { EnhancedStockItem } from '../stock/EnhancedStockTypes';
import { StockContext } from './StockContext';
import { isFirebaseDemoMode } from '../../utils/firebase/config';

interface StockProviderSafeProps {
  children: ReactNode;
}

// Minimal fallback stock provider that uses the shared StockContext
function FallbackStockProvider({ children }: { children: ReactNode }) {
  const [allStock] = React.useState<EnhancedStockItem[]>(() => {
    try {
      const demoResponse = getDemoStockResponse();
      console.log('FallbackStockProvider: Using demo data only');
      return demoResponse.stocks;
    } catch (error) {
      console.error('Failed to load demo data in fallback:', error);
      return [];
    }
  });

  const value = {
    allStock,
    userStock: [],
    isLoading: false,
    backgroundLoading: false,
    error: null,
    isFirebaseSync: false,
    refreshStock: async () => {
      console.log('FallbackStockProvider: Refresh called (no-op)');
    },
    addStock: async () => {
      console.log('FallbackStockProvider: Add stock called (no-op)');
      return false;
    },
    updateStock: async () => {
      console.log('FallbackStockProvider: Update stock called (no-op)');
      return false;
    },
    deleteStock: async () => {
      console.log('FallbackStockProvider: Delete stock called (no-op)');
      return false;
    },
    bulkDeleteStock: async (stockIds: string[]) => {
      console.log('FallbackStockProvider: Bulk delete called (no-op)', stockIds);
      return false;
    },
    bulkUpdateStockStatus: async (stockIds: string[], status: string) => {
      console.log('FallbackStockProvider: Bulk update status called (no-op)', stockIds, status);
      return false;
    },
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

class StockProviderErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StockProvider failed, using fallback:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('StockProvider error boundary triggered, using fallback provider');
      return (
        <FallbackStockProvider>
          {this.props.children}
        </FallbackStockProvider>
      );
    }

    return this.props.children;
  }
}

export function StockProviderSafe({ children }: StockProviderSafeProps) {
  // Synchronously check if Firebase is configured at render time
  const isFirebaseConfigured = !isFirebaseDemoMode;
  
  // Log the mode on mount with detailed debugging
  useEffect(() => {
    console.log('🔍 StockProviderSafe - Firebase Configuration Check:');
    console.log('  • isFirebaseDemoMode:', isFirebaseDemoMode);
    console.log('  • isFirebaseConfigured:', isFirebaseConfigured);
    console.log('  • Provider selected:', isFirebaseConfigured ? 'StockProvider (Firebase)' : 'StockProviderLocalSync (LocalStorage)');
    
    if (isFirebaseDemoMode) {
      console.log('⚠️  Firebase not configured - Using local sync mode');
      console.log('📝 To enable Firebase real-time sync, update /firebase-credentials.ts with your Firebase project credentials');
    } else {
      console.log('✅ Firebase configured - Using real-time sync');
    }
  }, [isFirebaseConfigured]);

  // Use Firebase provider if configured, otherwise use local sync
  const ProviderComponent = isFirebaseConfigured ? StockProvider : StockProviderLocalSync;

  return (
    <StockProviderErrorBoundary>
      <ProviderComponent>
        {children}
      </ProviderComponent>
    </StockProviderErrorBoundary>
  );
}
