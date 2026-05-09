// Utility to add timeout protection to async operations
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Utility to prevent event listener memory leaks
export function safeAddEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): () => void {
  try {
    target.addEventListener(type, listener, options);
    return () => {
      try {
        target.removeEventListener(type, listener, options);
      } catch (error) {
        console.warn(`Error removing event listener for ${type}:`, error);
      }
    };
  } catch (error) {
    console.warn(`Error adding event listener for ${type}:`, error);
    return () => {}; // Return no-op cleanup function
  }
}

// Utility to safely dispatch custom events
export function safeDispatchEvent(
  target: EventTarget,
  event: Event | CustomEvent
): boolean {
  try {
    return target.dispatchEvent(event);
  } catch (error) {
    console.warn('Error dispatching event:', error);
    return false;
  }
}

// Utility to create a debounced function with timeout protection
export function createDebouncedWithTimeout<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  maxTimeout: number = 30000
): T {
  let timeoutId: NodeJS.Timeout;
  let maxTimeoutId: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    clearTimeout(maxTimeoutId);

    // Set maximum timeout to prevent hanging
    maxTimeoutId = setTimeout(() => {
      console.warn('Debounced function exceeded maximum timeout');
    }, maxTimeout);

    timeoutId = setTimeout(() => {
      clearTimeout(maxTimeoutId);
      try {
        func(...args);
      } catch (error) {
        console.warn('Error in debounced function:', error);
      }
    }, delay);
  }) as T;
}

// Fast timeout for critical operations
export function withFastTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 3000,
  timeoutMessage: string = 'Fast operation timed out'
): Promise<T> {
  return withTimeout(promise, timeoutMs, timeoutMessage);
}

// Component-specific timeout protection
export function withComponentTimeout<T>(
  promise: Promise<T>,
  componentName: string,
  timeoutMs: number = 8000
): Promise<T> {
  return withTimeout(promise, timeoutMs, `${componentName} component timed out`);
}