/**
 * Suppress Firebase Connection Warnings
 * This file should be imported BEFORE Firebase config
 */

// Suppress all console.log messages from Firebase SDK
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Intercept console.log
  console.log = (...args: any[]) => {
    const logStr = args.join(' ').toLowerCase();
    
    // Suppress Firebase Firestore connection messages
    if (
      logStr.includes('@firebase/firestore') ||
      logStr.includes('could not reach cloud firestore') ||
      logStr.includes('backend didn\'t respond') ||
      logStr.includes('operate in offline mode') ||
      logStr.includes('healthy internet connection')
    ) {
      return; // Silently ignore
    }
    
    // Pass through all other logs
    originalLog.apply(console, args);
  };

  // Intercept console.warn
  console.warn = (...args: any[]) => {
    const warnStr = args.join(' ').toLowerCase();
    
    // Suppress Firebase warnings
    if (
      warnStr.includes('@firebase/firestore') ||
      warnStr.includes('could not reach cloud firestore') ||
      warnStr.includes('backend didn\'t respond') ||
      warnStr.includes('operate in offline mode') ||
      warnStr.includes('healthy internet connection')
    ) {
      return; // Silently ignore
    }
    
    // Pass through all other warnings
    originalWarn.apply(console, args);
  };

  // Intercept console.error
  console.error = (...args: any[]) => {
    const errorStr = args.join(' ').toLowerCase();
    
    // Suppress Firebase connection errors
    if (
      errorStr.includes('@firebase/firestore') ||
      errorStr.includes('could not reach cloud firestore') ||
      errorStr.includes('backend didn\'t respond') ||
      errorStr.includes('operate in offline mode') ||
      errorStr.includes('webchannelconnection') ||
      errorStr.includes('webchannel') ||
      (errorStr.includes('firestore') && errorStr.includes('transport'))
    ) {
      return; // Silently ignore
    }
    
    // Pass through all other errors
    originalError.apply(console, args);
  };
}
