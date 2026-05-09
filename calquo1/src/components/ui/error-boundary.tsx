import React from 'react';
import { errorRecovery } from '../utils/error-recovery';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const isTimeoutError = error?.message?.includes('timeout') || error?.message?.includes('timed out');
  const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="text-center space-y-4 p-6 bg-card rounded-lg shadow-lg max-w-md">
        <div className="text-destructive text-4xl">
          {isTimeoutError ? '⏱️' : isNetworkError ? '🌐' : '⚠️'}
        </div>
        <h2 className="text-xl font-semibold">
          {isTimeoutError ? 'Request Timed Out' : isNetworkError ? 'Network Error' : 'Something Went Wrong'}
        </h2>
        <p className="text-muted-foreground">
          {isTimeoutError ? 
            'The request is taking longer than expected. This might be due to slow network connectivity.' :
            isNetworkError ?
            'Unable to connect to the server. Please check your internet connection.' :
            error?.message || 'An unexpected error occurred in the application.'
          }
        </p>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left text-xs bg-muted p-3 rounded border">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-2 overflow-auto">{error.stack}</pre>
          </details>
        )}
        
        <div className="space-y-2">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh Page
          </button>
          
          {(isTimeoutError || isNetworkError) && (
            <button 
              onClick={() => {
                // Clear any cached data and reload
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Clear Cache & Refresh
            </button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          If the problem persists, please check your internet connection or try again later.
        </p>
      </div>
    </div>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Create detailed error report
    errorRecovery.createErrorReport(error, 'ErrorBoundary');
    
    // Log specific timeout errors for debugging
    if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      console.warn('Timeout error caught by ErrorBoundary:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
      
      // Auto-fix timeout-related issues
      const { fixed } = errorRecovery.autoFix();
      if (fixed > 0) {
        console.log(`Auto-fixed ${fixed} issues after timeout error`);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}
