import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  providerName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isProviderError: boolean;
}

export class ProviderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isProviderError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isProviderError = error.message?.includes('Provider') || 
                           error.message?.includes('Context') ||
                           error.message?.includes('timeout') ||
                           error.message?.includes('categories');
                           
    return {
      hasError: true,
      error,
      isProviderError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProviderErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isProviderError: false
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If it's a provider error, show a minimal non-blocking error
      if (this.state.isProviderError) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Loading Issue
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  {this.props.providerName 
                    ? `There was an issue loading ${this.props.providerName} data.`
                    : 'There was a temporary loading issue.'
                  } The app is using fallback data.
                </p>
                
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Continue with App
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    The app will work normally with default data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // For other errors, show standard error boundary
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                App Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 leading-relaxed">
                An unexpected error occurred while loading the application.
              </p>
              
              {this.state.error && (
                <details className="text-left bg-gray-50 p-3 rounded-lg border">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Technical Details
                  </summary>
                  <p className="mt-2 text-xs text-gray-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </details>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full rounded-xl border-2"
                >
                  Reload App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
