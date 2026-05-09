// Performance optimization utilities for Tex-App

export const performanceOptimizer = {
  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for frequent operations
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Request idle callback polyfill
  requestIdleCallback: (callback: () => void, timeout = 5000) => {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback, { timeout });
    } else {
      return setTimeout(callback, 1);
    }
  },

  // Check if app should use performance mode (fast, non-blocking)
  shouldUsePerformanceMode: (): boolean => {
    try {
      // Quick checks only - don't block app startup
      const connection = (navigator as any).connection;
      const slowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
      const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
      const slowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      
      return Boolean(slowConnection || lowMemory || slowCPU);
    } catch (error) {
      // If any check fails, default to normal mode
      console.warn('Performance mode check failed:', error);
      return false;
    }
  },

  // Preload critical resources
  preloadCriticalResources: () => {
    // Preload critical API endpoints
    const criticalEndpoints = ['/health', '/database-status'];
    
    criticalEndpoints.forEach(endpoint => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = endpoint;
      document.head.appendChild(link);
    });
  },

  // Optimize images loading
  optimizeImageLoading: () => {
    // Enable native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[data-src]').forEach((img: any) => {
        img.src = img.dataset.src;
        img.loading = 'lazy';
      });
    }
  },

  // Memory cleanup
  cleanupMemory: () => {
    // Force garbage collection if available (development only)
    if (typeof window.gc === 'function' && process.env.NODE_ENV === 'development') {
      window.gc();
    }
  },

  // Monitor performance metrics
  monitorPerformance: () => {
    if ('performance' in window && 'measure' in performance) {
      // Track key metrics
      const metrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0
      };

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.fcp = entries[0].startTime;
        console.log('FCP:', metrics.fcp);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.lcp = entries[entries.length - 1].startTime;
        console.log('LCP:', metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      return metrics;
    }
    return null;
  }
};

// Auto-optimize on load
if (typeof window !== 'undefined') {
  performanceOptimizer.preloadCriticalResources();
  
  // Start monitoring in development
  if (process.env.NODE_ENV === 'development') {
    performanceOptimizer.monitorPerformance();
  }
}

export default performanceOptimizer;