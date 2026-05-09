// Lightweight app performance monitor for tracking loading issues
class AppPerformanceMonitor {
  private static instance: AppPerformanceMonitor;
  private startTime: number;
  private milestones: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  static getInstance(): AppPerformanceMonitor {
    if (!AppPerformanceMonitor.instance) {
      AppPerformanceMonitor.instance = new AppPerformanceMonitor();
    }
    return AppPerformanceMonitor.instance;
  }

  // Mark a milestone in the loading process
  mark(milestone: string): void {
    const elapsed = performance.now() - this.startTime;
    this.milestones.set(milestone, elapsed);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${milestone}: ${elapsed.toFixed(2)}ms`);
    }
    
    // Log warnings for slow operations
    if (elapsed > 10000) { // 10 seconds
      console.warn(`[Performance Warning] ${milestone} took ${elapsed.toFixed(2)}ms`);
    }
  }

  // Get performance summary
  getSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    this.milestones.forEach((time, milestone) => {
      summary[milestone] = time;
    });
    return summary;
  }

  // Reset the monitor
  reset(): void {
    this.startTime = performance.now();
    this.milestones.clear();
  }

  // Check if we're approaching timeout
  isApproachingTimeout(threshold: number = 25000): boolean {
    const elapsed = performance.now() - this.startTime;
    return elapsed > threshold;
  }

  // Get current elapsed time
  getElapsed(): number {
    return performance.now() - this.startTime;
  }
}

export const appPerformanceMonitor = AppPerformanceMonitor.getInstance();

// Helper function to wrap async operations with timeout monitoring
export function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  timeoutMs: number = 15000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      appPerformanceMonitor.mark(`${operationName}_timeout`);
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      appPerformanceMonitor.mark(`${operationName}_start`);
      const result = await operation();
      appPerformanceMonitor.mark(`${operationName}_complete`);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      appPerformanceMonitor.mark(`${operationName}_error`);
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}