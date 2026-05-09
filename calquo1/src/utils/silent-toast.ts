/**
 * Silent Toast Utility for Phase 1 Testing
 * Replaces all toast notifications with silent console logs
 * No visible popups/toasts shown to users
 */

import { isDev, isProd } from './dev-check';

const isProduction = isProd();

export const toast = {
  success: (message: string, options?: any) => {
    if (isDev() && !isProduction) {
      console.log('✅ Toast (suppressed):', message);
    }
    // Completely silent in production
  },
  
  error: (message: string, options?: any) => {
    if (isDev() && !isProduction) {
      console.warn('❌ Toast (suppressed):', message);
    }
    // Completely silent in production
  },
  
  info: (message: string, options?: any) => {
    if (isDev() && !isProduction) {
      console.log('ℹ️ Toast (suppressed):', message);
    }
    // Completely silent in production
  },
  
  warning: (message: string, options?: any) => {
    if (isDev() && !isProduction) {
      console.warn('⚠️ Toast (suppressed):', message);
    }
    // Completely silent in production
  },
  
  loading: (message: string, options?: any) => {
    if (isDev() && !isProduction) {
      console.log('⏳ Toast (suppressed):', message);
    }
    // Completely silent in production
    return { id: Math.random().toString() }; // Return fake ID for compatibility
  },
  
  promise: async (promise: Promise<any>, messages: any, options?: any) => {
    if (isDev() && !isProduction) {
      console.log('Promise toast (suppressed):', messages);
    }
    // Just execute the promise silently
    try {
      const result = await promise;
      return result;
    } catch (error) {
      if (isDev) {
        console.warn('Promise failed (silent):', error);
      }
      throw error;
    }
  },
  
  dismiss: (id?: string) => {
    // No-op in silent mode
  },
  
  custom: (component: any, options?: any) => {
    if (isDev && !isProduction) {
      console.log('Custom toast (suppressed)');
    }
    // Completely silent in production
  }
};

// Export as default for easier migration
export default toast;
