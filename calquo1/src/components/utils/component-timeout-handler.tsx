import React, { Component, ReactNode, ErrorInfo } from 'react';

interface TimeoutErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface TimeoutErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
  timeout?: number;
}

export class ComponentTimeoutHandler extends Component<TimeoutErrorBoundaryProps, TimeoutErrorBoundaryState> {
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(props: TimeoutErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): TimeoutErrorBoundaryState {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only handle actual timeout errors, not warnings
    if (error.message?.includes('getPage') && error.message?.includes('timed out')) {
      console.warn('Component timeout detected:', error.message);
      
      // Clear any pending timeouts
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      // Attempt recovery after a longer delay
      this.timeoutId = setTimeout(() => {
        if (this.state.retryCount < (this.props.maxRetries || 1)) {
          this.setState(prev => ({
            hasError: false,
            error: undefined,
            retryCount: prev.retryCount + 1
          }));
        }
      }, 2000); // Longer delay for recovery
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            Component loading timed out
          </div>
          <button 
            onClick={this.handleRetry}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility function to wrap components with timeout protection
export function withTimeoutProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return React.forwardRef<any, P>((props, ref) => (
    <ComponentTimeoutHandler fallback={fallback}>
      <WrappedComponent {...props} ref={ref} />
    </ComponentTimeoutHandler>
  ));
}

// Simple timeout protection hook
export function useComponentTimeout(timeout: number = 10000) {
  const [isTimedOut, setIsTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const reset = React.useCallback(() => {
    setIsTimedOut(false);
  }, []);

  return { isTimedOut, reset };
}
