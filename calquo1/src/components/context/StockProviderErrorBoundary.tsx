import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class StockProviderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch stock-related errors, let other errors bubble up
    if (error.message?.includes('stock') || error.message?.includes('timeout')) {
      console.log('StockProvider error caught by boundary:', error.message);
      return { hasError: true };
    }
    throw error; // Re-throw if not stock-related
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('StockProvider error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing - let the app continue without stock data
      return this.props.children;
    }

    return this.props.children;
  }
}
