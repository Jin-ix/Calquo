// Lightweight performance tracking for critical app operations
interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private static instance: PerformanceTracker;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startOperation(operationId: string, operationName: string): void {
    this.metrics.set(operationId, {
      operation: operationName,
      startTime: performance.now(),
      success: false
    });
  }

  endOperation(operationId: string, success: boolean = true, error?: string): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.success = success;
      metric.error = error;

      // Only log slow operations or failures in development
      if (process.env.NODE_ENV === 'development') {
        if (!success || metric.duration > 5000) { // Log if operation failed or took > 5 seconds
          console.log(`Performance: ${metric.operation} ${success ? 'completed' : 'failed'} in ${metric.duration.toFixed(2)}ms`, error ? { error } : '');
        }
      }

      // Clean up completed metrics after a short time
      setTimeout(() => {
        this.metrics.delete(operationId);
      }, 60000); // Keep for 1 minute
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Helper method to track async operations
  async trackAsync<T>(
    operationId: string, 
    operationName: string, 
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    this.startOperation(operationId, operationName);
    try {
      const result = await asyncOperation();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      this.endOperation(operationId, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const performanceTracker = PerformanceTracker.getInstance();

// Helper function for quick operation tracking
export function trackOperation<T>(
  operationName: string,
  operation: () => T | Promise<T>
): Promise<T> {
  const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (operation instanceof Promise || (typeof operation === 'function' && operation.constructor.name === 'AsyncFunction')) {
    return performanceTracker.trackAsync(operationId, operationName, operation as () => Promise<T>);
  } else {
    performanceTracker.startOperation(operationId, operationName);
    try {
      const result = (operation as () => T)();
      performanceTracker.endOperation(operationId, true);
      return Promise.resolve(result);
    } catch (error) {
      performanceTracker.endOperation(operationId, false, error instanceof Error ? error.message : String(error));
      return Promise.reject(error);
    }
  }
}