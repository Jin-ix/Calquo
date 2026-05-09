import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CategoryProviderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's any known error type that we want to handle silently
    if (error.message?.includes('categor') || 
        error.message?.includes('timeout') ||
        error.message?.includes('Categories load') ||
        error.message?.includes('createProtectedTimeout') ||
        error.message?.includes('startupTimeoutProtection') ||
        error.message?.includes('Cannot read properties of undefined')) {
      console.log('CategoryProvider error caught and handled silently:', error.message);
      // Don't change state - let the app continue normally
      return { hasError: false, error: null };
    }
    
    // For other errors, still handle them gracefully but log them
    console.warn('CategoryProvider non-critical error handled:', error.message);
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle all category-related errors silently
    if (error.message?.includes('categor') || 
        error.message?.includes('timeout') ||
        error.message?.includes('Categories load') ||
        error.message?.includes('createProtectedTimeout') ||
        error.message?.includes('startupTimeoutProtection') ||
        error.message?.includes('Cannot read properties of undefined')) {
      console.log('CategoryProvider error boundary handled silently:', error.message);
      return;
    }
    
    // Log other errors but don't crash
    console.log('CategoryProvider boundary handled error:', error.message);
  }

  render() {
    // Always render children - never block the app
    return this.props.children;
  }
}
