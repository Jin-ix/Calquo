// Lightweight performance monitoring for fast startup
export const lightPerformanceMonitor = {
  // Simple performance tracking without heavy operations
  startTime: Date.now(),
  
  // Mark app start without complex monitoring
  markAppStart: () => {
    try {
      const elapsed = Date.now() - lightPerformanceMonitor.startTime;
      
      // Only log if startup is unusually slow (over 5 seconds)
      if (elapsed > 5000 && process.env.NODE_ENV === 'development') {
        console.log(`[Light Performance] App startup took ${elapsed}ms`);
      }
      
      // Store in session for debugging
      sessionStorage.setItem('app_startup_time', elapsed.toString());
      
    } catch (error) {
      // Silent fail - don't interfere with app startup
    }
  },

  // Get startup time without heavy operations
  getStartupTime: () => {
    try {
      return parseInt(sessionStorage.getItem('app_startup_time') || '0');
    } catch (error) {
      return 0;
    }
  },

  // Check if startup was fast
  isFastStartup: () => {
    return lightPerformanceMonitor.getStartupTime() < 3000; // Under 3 seconds is fast
  },

  // Reset monitoring
  reset: () => {
    lightPerformanceMonitor.startTime = Date.now();
    try {
      sessionStorage.removeItem('app_startup_time');
    } catch (error) {
      // Silent fail
    }
  }
};

// Initialize on import
if (typeof window !== 'undefined') {
  // Mark when the monitoring starts
  lightPerformanceMonitor.startTime = Date.now();
  
  // Mark app start after DOM is ready
  if (document.readyState === 'complete') {
    setTimeout(() => lightPerformanceMonitor.markAppStart(), 100);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => lightPerformanceMonitor.markAppStart(), 100);
    });
  }
}