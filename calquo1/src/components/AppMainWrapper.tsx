import React, { Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from './ui/error-boundary';
import { AppMain } from './AppMain';
import { MobileAppWrapper } from './layout/MobileAppWrapper';
import { SimpleMobileWrapper } from './layout/SimpleMobileWrapper';
import { OfflineModeBanner } from './layout/OfflineModeBanner';

interface AppMainWrapperProps {
  user: any;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md p-6">
        <div className="text-red-500 text-6xl">⚠️</div>
        <h2 className="text-xl font-semibold">Application Error</h2>
        <p className="text-muted-foreground">
          Something went wrong. Please refresh the page to try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export function AppMainWrapper({ user }: AppMainWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div className="min-h-screen">
        {/* Offline Mode Banner */}
        <OfflineModeBanner />

        <Suspense fallback={<LoadingFallback />}>
          {isMobile ? (
            <MobileAppWrapper user={user} />
          ) : (
            <AppMain user={user} />
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
