// Lightweight startup utilities to prevent timeout issues
import { emergencyMessageCleanup } from './message-timeout-protection';

export const lightStartup = {
  // Minimal initialization without heavy operations
  init: () => {
    try {
      // Only essential cleanup
      emergencyMessageCleanup();
      
      // Mark app as started without complex monitoring
      sessionStorage.setItem('app_status', 'started');
      sessionStorage.setItem('app_start_time', Date.now().toString());
      
      // Clean up initial loader
      const initialLoader = document.getElementById('initialLoader');
      if (initialLoader) {
        setTimeout(() => initialLoader.remove(), 100);
      }
      
    } catch (error) {
      // Silent fail - don't cause cascading errors
      console.warn('Light startup init failed:', error);
    }
  },

  // Minimal error recovery
  handleCriticalError: (error: string) => {
    try {
      if (error.includes('getPage') && error.includes('timed out')) {
        // Only handle actual timeout errors
        emergencyMessageCleanup();
        
        // Force reload after brief delay
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 1000);
        
        return true; // Handled
      }
      return false; // Not handled
    } catch (e) {
      return false;
    }
  },

  // Check if app is in a healthy state
  isHealthy: () => {
    try {
      const startTime = parseInt(sessionStorage.getItem('app_start_time') || '0');
      const now = Date.now();
      
      // If app has been running for less than 10 minutes, consider it healthy
      return (now - startTime) < 600000;
    } catch (error) {
      return true; // Assume healthy if can't check
    }
  }
};

// React hook for lightweight component monitoring
export function useLightComponentMonitor(componentName: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  React.useEffect(() => {
    // Mark component as loaded after brief delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return { isLoaded };
}

// Import React for the hook
import React from 'react';
