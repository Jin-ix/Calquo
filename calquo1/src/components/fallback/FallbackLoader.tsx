import React, { useState, useEffect } from 'react';

interface FallbackLoaderProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
  showForceButton?: boolean;
  onForceLoad?: () => void;
}

export function FallbackLoader({
  message = "Loading...",
  timeout = 10000,
  onTimeout,
  showForceButton = true,
  onForceLoad
}: FallbackLoaderProps) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    // Update elapsed time every second
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    // Set timeout
    const timeoutTimer = setTimeout(() => {
      console.warn(`FallbackLoader: Timeout reached after ${timeout}ms`);
      setTimeoutReached(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    return () => {
      clearInterval(timer);
      clearTimeout(timeoutTimer);
    };
  }, [timeout, onTimeout]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${Math.round(ms / 1000)}s`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        
        <div className="space-y-2">
          <p className="text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(elapsedTime)} elapsed
          </p>
        </div>

        {timeoutReached && (
          <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-orange-800">
              <p className="font-medium">Taking longer than expected</p>
              <p className="text-sm">This might be due to slow network connectivity.</p>
            </div>
            
            {showForceButton && onForceLoad && (
              <button
                onClick={onForceLoad}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue Anyway
              </button>
            )}
            
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted transition-colors"
              >
                Clear Cache & Refresh
              </button>
            </div>
          </div>
        )}

        {!timeoutReached && elapsedTime > 5000 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            Still loading... This may take a moment on slower connections.
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to use fallback loader
export function useFallbackLoader(
  isLoading: boolean, 
  timeout: number = 10000
): {
  showFallback: boolean;
  timeoutReached: boolean;
  forceLoad: () => void;
} {
  const [showFallback, setShowFallback] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [forceLoaded, setForceLoaded] = useState(false);

  useEffect(() => {
    if (isLoading && !forceLoaded) {
      setShowFallback(true);
      
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      setShowFallback(false);
      setTimeoutReached(false);
    }
  }, [isLoading, timeout, forceLoaded]);

  const forceLoad = () => {
    setForceLoaded(true);
    setShowFallback(false);
    setTimeoutReached(false);
  };

  return {
    showFallback: showFallback && !forceLoaded,
    timeoutReached,
    forceLoad
  };
}
