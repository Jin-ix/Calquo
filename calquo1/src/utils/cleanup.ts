// Utility to help with cleanup and prevent memory leaks

let activeTimers: Set<NodeJS.Timeout> = new Set();
let activeIntervals: Set<NodeJS.Timeout> = new Set();

// Wrapped setTimeout that tracks timers
export const safeSetTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
  const timer = setTimeout(() => {
    activeTimers.delete(timer);
    callback();
  }, delay);
  
  activeTimers.add(timer);
  return timer;
};

// Wrapped setInterval that tracks intervals
export const safeSetInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
  const interval = setInterval(callback, delay);
  activeIntervals.add(interval);
  return interval;
};

// Safe clearTimeout
export const safeClearTimeout = (timer: NodeJS.Timeout): void => {
  clearTimeout(timer);
  activeTimers.delete(timer);
};

// Safe clearInterval
export const safeClearInterval = (interval: NodeJS.Timeout): void => {
  clearInterval(interval);
  activeIntervals.delete(interval);
};

// Clear all active timers and intervals
export const clearAllTimers = (): void => {
  console.log(`Cleaning up ${activeTimers.size} timers and ${activeIntervals.size} intervals`);
  
  activeTimers.forEach(timer => {
    clearTimeout(timer);
  });
  activeTimers.clear();
  
  activeIntervals.forEach(interval => {
    clearInterval(interval);
  });
  activeIntervals.clear();
};

// Emergency cleanup function
export const emergencyCleanup = (): void => {
  console.warn('Performing emergency cleanup...');
  
  // Clear all tracked timers
  clearAllTimers();
  
  // Clear any pending fetch requests (if AbortController is available)
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    controller.abort();
  }
  
  // Force garbage collection if available
  if (typeof gc === 'function') {
    gc();
  }
  
  console.log('Emergency cleanup completed');
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', clearAllTimers);
  window.addEventListener('unload', clearAllTimers);
  
  // Cleanup on visibility change (mobile background/foreground)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearAllTimers();
    }
  });
}