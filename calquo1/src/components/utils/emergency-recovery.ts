// Emergency recovery utility for getPage timeouts
// This runs independently of React to avoid hook ordering issues

let isRecoveryActive = false;

export function initEmergencyRecovery() {
  if (isRecoveryActive) return;
  isRecoveryActive = true;

  let reloadTimeout: NodeJS.Timeout;
  
  // Enhanced timeout protection with error suppression
  const emergencyTimeout = setTimeout(() => {
    if (!document.body.hasAttribute('data-app-loaded')) {
      // Silently reload without showing error message
      window.location.reload();
    }
  }, 20000);

  // Enhanced error suppression for deployment and network issues
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  const suppressPatterns = [
    '@firebase/firestore',
    'could not reach cloud firestore',
    'backend',
    'offline mode',
    'failed to get document',
    'network error',
    'fetch failed',
    'failed to fetch',
    'load failed',
    'networkerror',
    'failed to load resource'
  ];
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (suppressPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()))) {
      return; // Silently suppress deployment and network errors
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (suppressPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()))) {
      return; // Silently suppress deployment warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Listen for app loaded signal
  const checkAppLoaded = () => {
    if (document.body.hasAttribute('data-app-loaded')) {
      clearTimeout(emergencyTimeout);
      clearInterval(checkInterval);
    }
  };

  const checkInterval = setInterval(checkAppLoaded, 1000);

  // Cleanup function
  return () => {
    clearTimeout(emergencyTimeout);
    clearInterval(checkInterval);
  };
}

// Mark app as loaded (called from React components)
export function markAppAsLoaded() {
  document.body.setAttribute('data-app-loaded', 'true');
  console.log('Emergency recovery: App marked as loaded');
}

// Simplified getPage error detection - let direct-getpage-fix handle it
export function detectGetPageErrors() {
  // This is now handled by direct-getpage-fix.ts
  // Just log for debugging
  console.log('Emergency recovery: getPage error detection initialized (handled by direct-getpage-fix)');
}

// Initialize on import
if (typeof window !== 'undefined') {
  initEmergencyRecovery();
  detectGetPageErrors();
}