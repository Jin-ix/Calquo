import React from 'react';

interface StartupErrorBoundaryProps {
  children: React.ReactNode;
}

interface StartupErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class StartupErrorBoundary extends React.Component<
  StartupErrorBoundaryProps,
  StartupErrorBoundaryState
> {
  constructor(props: StartupErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): StartupErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StartupErrorBoundary caught an error during app startup:', error, errorInfo);
    
    // Log startup-specific context
    console.log('Startup error context:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorMessage: error.message,
      errorName: error.name,
      retryCount: this.state.retryCount
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 p-6 bg-card rounded-lg shadow-lg max-w-md">
            <div className="text-destructive text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold">App Startup Failed</h2>
            <p className="text-muted-foreground">
              The application failed to start properly. This might be due to a network issue or browser compatibility.
            </p>
            
            {this.state.retryCount < 3 && (
              <button 
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again ({3 - this.state.retryCount} attempts remaining)
              </button>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Reload Page
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-xs bg-muted p-3 rounded border mt-4">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <pre className="mt-2 overflow-auto">{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
