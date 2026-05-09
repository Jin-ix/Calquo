import React, { useEffect, useRef, useState } from 'react';

// Enhanced timeout protection specifically for getPage and message timeouts
export class EnhancedTimeoutProtection {
  private static readonly DEFAULT_TIMEOUT = 25000; // 25 seconds
  private static readonly EMERGENCY_TIMEOUT = 35000; // 35 seconds
  private static activeTimeouts = new Set<NodeJS.Timeout>();
  private static messageQueue = new Map<string, any>();
  private static isEmergencyMode = false;

  // Detect getPage timeout pattern
  static isGetPageTimeout(error: Error | string): boolean {
    const errorMsg = typeof error === 'string' ? error : error.message;
    return errorMsg?.includes('getPage') && errorMsg?.includes('timed out');
  }

  // Enhanced component loading with timeout protection
  static wrapComponentLoading<T>(
    componentLoader: () => Promise<T>,
    componentName: string,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let isResolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.handleTimeout(componentName);
          reject(new Error(`Component ${componentName} loading timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.activeTimeouts.add(timeoutId);

      componentLoader()
        .then(result => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            this.activeTimeouts.delete(timeoutId);
            resolve(result);
          }
        })
        .catch(error => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            this.activeTimeouts.delete(timeoutId);
            
            // If it's a getPage timeout, handle specially
            if (this.isGetPageTimeout(error)) {
              this.handleGetPageTimeout(componentName);
              reject(new Error(`getPage timeout in ${componentName} - attempting recovery`));
            } else {
              reject(error);
            }
          }
        });
    });
  }

  // Handle specific getPage timeouts
  private static handleGetPageTimeout(componentName: string): void {
    console.warn(`[getPage Timeout] Component: ${componentName}`);
    
    // Enable emergency mode temporarily
    this.isEmergencyMode = true;
    
    // Try to clear any hanging operations
    this.emergencyCleanup();
    
    // Reset emergency mode after delay
    setTimeout(() => {
      this.isEmergencyMode = false;
    }, 5000);
  }

  // Handle general timeouts
  private static handleTimeout(componentName: string): void {
    console.warn(`[Timeout] Component: ${componentName} failed to load within timeout`);
    
    // If we have too many timeouts, enable emergency mode
    if (this.activeTimeouts.size > 3) {
      this.isEmergencyMode = true;
      this.emergencyCleanup();
    }
  }

  // Emergency cleanup for severe timeout situations
  static emergencyCleanup(): void {
    try {
      // Clear all active timeouts
      this.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.activeTimeouts.clear();

      // Clear message queue
      this.messageQueue.clear();

      // Force garbage collection if available
      if (typeof window !== 'undefined') {
        // Cancel any pending animation frames
        let rafId = requestAnimationFrame(() => {});
        while (rafId-- > 0) {
          try {
            cancelAnimationFrame(rafId);
          } catch (e) {
            // Ignore errors
          }
        }

        // Clear interval/timeout ids
        let id = setTimeout(() => {}, 0);
        while (id-- > 0) {
          try {
            clearTimeout(id);
            clearInterval(id);
          } catch (e) {
            // Ignore errors
          }
        }

        // Try to trigger garbage collection
        if ('gc' in window && typeof (window as any).gc === 'function') {
          try {
            (window as any).gc();
          } catch (e) {
            // Ignore errors
          }
        }
      }

      console.log('[EnhancedTimeoutProtection] Emergency cleanup completed');
    } catch (error) {
      console.error('[EnhancedTimeoutProtection] Emergency cleanup failed:', error);
    }
  }

  // Get current status
  static getStatus() {
    return {
      isEmergencyMode: this.isEmergencyMode,
      activeTimeouts: this.activeTimeouts.size,
      queuedMessages: this.messageQueue.size
    };
  }

  // Clear all protections
  static clearAll(): void {
    this.activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();
    this.messageQueue.clear();
    this.isEmergencyMode = false;
  }
}

// React hook for component-level timeout protection
export function useEnhancedTimeoutProtection(componentName: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const startTime = Date.now();
    
    // Set a timeout for this component
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn(`[useEnhancedTimeoutProtection] ${componentName} timed out`);
        setHasTimedOut(true);
        setIsLoading(false);
        EnhancedTimeoutProtection.handleTimeout(componentName);
      }
    }, EnhancedTimeoutProtection.DEFAULT_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
      mountedRef.current = false;
    };
  }, [componentName, isLoading]);

  const markAsLoaded = () => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasTimedOut(false);
      setError(null);
    }
  };

  const markAsError = (err: Error) => {
    if (mountedRef.current) {
      setError(err);
      setIsLoading(false);
      
      if (EnhancedTimeoutProtection.isGetPageTimeout(err)) {
        setHasTimedOut(true);
      }
    }
  };

  const retry = () => {
    if (mountedRef.current) {
      setIsLoading(true);
      setHasTimedOut(false);
      setError(null);
    }
  };

  return {
    isLoading,
    hasTimedOut,
    error,
    markAsLoaded,
    markAsError,
    retry,
    status: EnhancedTimeoutProtection.getStatus()
  };
}

// Enhanced loading component that handles timeouts gracefully
export function EnhancedLoader({ 
  message = "Loading...", 
  componentName = "Unknown",
  showRetry = false,
  onRetry,
  timeout = 30000 
}: { 
  message?: string;
  componentName?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  timeout?: number;
}) {
  const [showTimeout, setShowTimeout] = useState(false);
  const { hasTimedOut, retry, status } = useEnhancedTimeoutProtection(componentName);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [timeout]);

  if (hasTimedOut || showTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⏱️</div>
          <h2 className="text-xl font-semibold mb-2">Loading Taking Longer Than Expected</h2>
          <p className="text-muted-foreground mb-4">
            The {componentName} component is taking longer to load than usual.
          </p>
          {status.isEmergencyMode && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-orange-700 text-sm">Emergency recovery mode active</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {(showRetry || onRetry) && (
              <button 
                onClick={() => {
                  if (onRetry) {
                    onRetry();
                  } else {
                    retry();
                  }
                  setShowTimeout(false);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Try Again
              </button>
            )}
            <button 
              onClick={() => {
                EnhancedTimeoutProtection.emergencyCleanup();
                window.location.reload();
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground mb-2">{message}</p>
        {componentName !== "Unknown" && (
          <p className="text-xs text-muted-foreground/70">Loading {componentName}...</p>
        )}
      </div>
    </div>
  );
}

// Wrapper for components that might timeout
export function TimeoutProtectedComponent({ 
  children, 
  componentName = "Component",
  fallback 
}: { 
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}) {
  const { hasTimedOut, error, markAsLoaded, markAsError } = useEnhancedTimeoutProtection(componentName);

  useEffect(() => {
    // Mark as loaded when component mounts successfully
    const timer = setTimeout(() => {
      markAsLoaded();
    }, 100);

    return () => clearTimeout(timer);
  }, [markAsLoaded]);

  // Handle errors from child components
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (EnhancedTimeoutProtection.isGetPageTimeout(event.error)) {
        markAsError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [markAsError]);

  if (hasTimedOut || error) {
    return fallback || (
      <EnhancedLoader 
        message="Recovering from timeout..."
        componentName={componentName}
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <>{children}</>;
}
