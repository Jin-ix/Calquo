/**
 * Safe development mode check utility
 * 
 * Use this instead of directly accessing import.meta.env to avoid
 * "Cannot read properties of undefined" errors in some environments.
 */

/**
 * Check if we're in development mode
 * Safe to use in all environments
 */
export const isDevelopment = (): boolean => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

/**
 * Check if we're in production mode
 * Safe to use in all environments
 */
export const isProduction = (): boolean => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;
  } catch {
    return true; // Default to production for safety
  }
};

/**
 * Get an environment variable safely
 * @param key - The environment variable key
 * @param fallback - Fallback value if not found
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Silent fail
  }
  return fallback;
};

/**
 * Console log only in development mode
 * @param args - Arguments to log
 */
export const devLog = (...args: any[]): void => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

/**
 * Console warn only in development mode
 * @param args - Arguments to warn
 */
export const devWarn = (...args: any[]): void => {
  if (isDevelopment()) {
    console.warn(...args);
  }
};

/**
 * Console error only in development mode
 * @param args - Arguments to error
 */
export const devError = (...args: any[]): void => {
  if (isDevelopment()) {
    console.error(...args);
  }
};
