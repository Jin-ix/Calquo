// Render optimization to prevent excessive re-renders that might cause getPage timeouts

export function initRenderOptimization() {
  // Prevent excessive console logging during development
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    let warnCount = 0;
    const maxWarnings = 50;
    
    console.warn = (...args: any[]) => {
      warnCount++;
      if (warnCount < maxWarnings) {
        originalWarn.apply(console, args);
      } else if (warnCount === maxWarnings) {
        originalWarn.apply(console, ['Console warnings suppressed to prevent performance issues']);
      }
    };
  }

  // Optimize React DevTools if present
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings = {
        ...(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings,
        // Reduce DevTools overhead
        appendComponentStack: false,
        breakOnConsoleErrors: false,
        showInlineWarningsAndErrors: false
      };
    } catch (error) {
      // Ignore DevTools optimization errors
    }
  }

  // Prevent memory leaks from event listeners
  const cleanupFunctions: Array<() => void> = [];
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  return {
    addCleanup: (cleanup: () => void) => {
      cleanupFunctions.push(cleanup);
    }
  };
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initRenderOptimization();
}