/**
 * Safe development mode check
 * Handles cases where import.meta might be undefined
 * 
 * For Phase 1 testing, this always returns true to enable all fallbacks
 */

/**
 * Check if we're in development mode
 * Returns true for Phase 1 testing to enable all fallbacks
 */
export function isDev(): boolean {
  // For Phase 1, always return true to enable all fallbacks
  // This ensures registration works without backend deployment
  return true;
}

/**
 * Check if we're in production mode
 */
export function isProd(): boolean {
  // For Phase 1, production mode is disabled
  return false;
}

/**
 * Safe console wrapper for development logging
 */
export function devLog(message: string, ...args: any[]): void {
  if (isDev()) {
    console.debug(message, ...args);
  }
}

/**
 * Safe console wrapper for development warnings
 */
export function devWarn(message: string, ...args: any[]): void {
  if (isDev()) {
    console.warn(message, ...args);
  }
}
