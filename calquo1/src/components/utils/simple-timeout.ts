// Simple timeout utility to replace withTimeout
export function simpleTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Utility for safe async operations
export function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  timeoutMs: number = 5000
): Promise<T> {
  return simpleTimeout(operation(), timeoutMs, 'Operation timed out')
    .catch((error) => {
      console.warn('Async operation failed, using fallback:', error);
      return fallback;
    });
}

// Safe timeout for components
export function componentTimeout<T>(
  promise: Promise<T>,
  componentName: string,
  timeoutMs: number = 10000
): Promise<T> {
  return simpleTimeout(
    promise, 
    timeoutMs, 
    `${componentName} component timed out`
  );
}