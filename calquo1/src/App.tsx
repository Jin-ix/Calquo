/**
 * CALIQUO - B2B Apparel Stock Management
 * Weaving India Together!
 * Version: 1.0.5 - Cache busting for Browse Stock updates
 * Updated: 2025-12-17
 */

// CRITICAL: Import warning suppressor FIRST, before any Firebase imports
import './utils/firebase/suppress-warnings';

import React, { useEffect, Suspense, lazy, useState } from 'react';
import { useDialogAccessibility } from './components/utils/dialog-accessibility';
import { Toaster } from './components/ui/sonner';

// Context Providers
import { LanguageProvider } from './components/context/LanguageProvider';
import { ThemeProvider } from './components/context/ThemeProvider';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { CategoryProvider } from './components/context/CategoryProvider';
import { StockProviderSafe } from './components/context/StockProviderSafe';
import { CartProvider } from './components/cart/CartProvider';
import { OrderProvider } from './components/context/OrderProvider';
import { BannerProvider } from './components/context/BannerProvider';
import { NotificationProvider } from './components/notifications/NotificationSystem';
import { BuilderProvider } from './components/builder/BuilderProvider';

// Development mode check (safe for all environments)
const isDevelopment = () => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

// Lazy loaded components
const LoginForm = lazy(() => import('./components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
const AppMainWrapper = lazy(() => import('./components/AppMainWrapper').then(m => ({ default: m.AppMainWrapper })));
const SuppliersInitializer = lazy(() => import('./components/suppliers/SuppliersInitializer').then(m => ({ default: m.SuppliersInitializer })));
const FirebaseConfigStatus = lazy(() => import('./components/status/FirebaseConfigStatus').then(m => ({ default: m.FirebaseConfigStatus })));

const mockInitialOrders = [];

// Silent loader - minimal, auto-hide after 2s
const SilentLoader = ({ message = "" }: { message?: string }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary opacity-50"></div>
    </div>
  );
};

// Silent error boundary - no visible errors, just retry
const SilentErrorBoundary = ({ error, resetError }: { error: Error, resetError: () => void }) => {
  useEffect(() => {
    // Silent log in dev only
    if (isDevelopment()) {
      console.warn('Silent error:', error.message);
    }
    
    // Auto-retry after 1 second
    const timer = setTimeout(() => {
      resetError();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [error, resetError]);
  
  // Show minimal spinner during recovery
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary opacity-30"></div>
    </div>
  );
};

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useDialogAccessibility();

  if (isLoading) {
    return <SilentLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Suspense fallback={<SilentLoader />}>
          <LoginForm />
        </Suspense>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<SilentLoader />}>
        <AppMainWrapper user={user} />
      </Suspense>
      
      {/* Silent suppliers initialization */}
      <Suspense fallback={null}>
        <SuppliersInitializer onInitialized={(count) => {
          if (isDevelopment()) {
            console.log(`Suppliers ready: ${count}`);
          }
        }} />
      </Suspense>
      
      {/* Firebase Configuration Status - only in development */}
      {isDevelopment() && (
        <Suspense fallback={null}>
          <FirebaseConfigStatus />
        </Suspense>
      )}
    </>
  );
}

// Provider wrapper with silent error handling
function SilentProviders({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return <SilentErrorBoundary error={error} resetError={() => setError(null)} />;
  }
  
  return (
    <BuilderProvider>
      <NotificationProvider>
        <BannerProvider>
          <CategoryProvider>
            <StockProviderSafe>
              <CartProvider>
                <OrderProvider initialOrders={mockInitialOrders}>
                  {children}
                </OrderProvider>
              </CartProvider>
            </StockProviderSafe>
          </CategoryProvider>
        </BannerProvider>
      </NotificationProvider>
    </BuilderProvider>
  );
}

export default function App() {
  useEffect(() => {
    // Silent error handling - no UI feedback for non-critical errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      if (isDevelopment()) {
        console.warn('Silent error:', event.message);
      }
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      if (isDevelopment()) {
        console.warn('Silent rejection:', event.reason);
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SilentProviders>
            <AppContent />
            <Toaster />
          </SilentProviders>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
