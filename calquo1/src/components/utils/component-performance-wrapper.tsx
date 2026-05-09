import React, { Component, ReactNode, ErrorInfo } from 'react';

interface PerformanceWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number;
}

interface PerformanceWrapperState {
  hasError: boolean;
  isLoading: boolean;
}

export class ComponentPerformanceWrapper extends Component<PerformanceWrapperProps, PerformanceWrapperState> {
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(props: PerformanceWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      isLoading: true
    };
  }

  componentDidMount() {
    // Set timeout protection
    const timeout = this.props.timeout || 5000; // 5 second default
    this.timeoutId = setTimeout(() => {
      this.setState({ isLoading: false });
    }, timeout);

    // Mark as loaded immediately for now
    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ComponentPerformanceWrapper caught an error:', error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Something went wrong</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    if (this.state.isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withPerformanceWrapper = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { timeout?: number; fallback?: ReactNode }
) => {
  const WithPerformanceWrapper = (props: P) => (
    <ComponentPerformanceWrapper timeout={options?.timeout} fallback={options?.fallback}>
      <WrappedComponent {...props} />
    </ComponentPerformanceWrapper>
  );

  WithPerformanceWrapper.displayName = `withPerformanceWrapper(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithPerformanceWrapper;
};
