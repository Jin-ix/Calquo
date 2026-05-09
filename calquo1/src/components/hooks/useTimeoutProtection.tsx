import { useEffect, useRef, useState } from 'react';
import { getPageMonitor } from '../utils/getpage-monitor';

interface TimeoutProtectionOptions {
  timeout?: number;
  onTimeout?: () => void;
  autoReload?: boolean;
}

export function useTimeoutProtection(options: TimeoutProtectionOptions = {}) {
  const {
    timeout = 20000,
    onTimeout,
    autoReload = true
  } = options;

  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setHasTimedOut(false);
    setIsLoading(true);

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      console.warn('useTimeoutProtection: Component timeout detected');
      setHasTimedOut(true);
      setIsLoading(false);
      
      if (onTimeout) {
        onTimeout();
      }
      
      if (autoReload) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }, timeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, onTimeout, autoReload]);

  const markAsLoaded = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const forceTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasTimedOut(true);
    setIsLoading(false);
    
    if (onTimeout) {
      onTimeout();
    }
  };

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    startTimeRef.current = Date.now();
    setHasTimedOut(false);
    setIsLoading(true);
    
    // Restart timeout
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
      if (onTimeout) onTimeout();
      if (autoReload) {
        setTimeout(() => window.location.reload(), 2000);
      }
    }, timeout);
  };

  const getElapsedTime = () => {
    return Date.now() - startTimeRef.current;
  };

  const getMonitorStats = () => {
    return getPageMonitor.getStats();
  };

  return {
    hasTimedOut,
    isLoading,
    markAsLoaded,
    forceTimeout,
    reset,
    getElapsedTime,
    getMonitorStats
  };
}

// Higher-order component for timeout protection
export function withTimeoutProtection<T extends object>(
  Component: React.ComponentType<T>,
  options: TimeoutProtectionOptions = {}
) {
  return function TimeoutProtectedComponent(props: T) {
    const { hasTimedOut, markAsLoaded } = useTimeoutProtection(options);

    useEffect(() => {
      // Mark as loaded after component mounts
      const timer = setTimeout(markAsLoaded, 100);
      return () => clearTimeout(timer);
    }, [markAsLoaded]);

    if (hasTimedOut) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-xl font-semibold mb-2">Component Timeout</h2>
            <p className="text-muted-foreground mb-4">
              This component took too long to load. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
