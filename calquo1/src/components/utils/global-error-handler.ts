// Global error handler for timeout and network issues
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 1; // Reduced from 2 to 1 for faster failure
  private silentOperations = new Set(['GET__categories', 'GET__stock_my_']);

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  // Check if operation should be silent (not log warnings/errors)
  private isSilentOperation(operationId: string): boolean {
    return this.silentOperations.has(operationId) || 
           Array.from(this.silentOperations).some(pattern => operationId.includes(pattern)) ||
           operationId.includes('BACKGROUND_') ||
           operationId.includes('categories') ||
           operationId.includes('categor') ||
           operationId.includes('CATEGORIES') ||
           operationId.includes('stock_my_') ||
           operationId.includes('health'); // Silent health checks until backend deployed
  }

  // Handle timeout errors with automatic retry
  async handleTimeoutError(operation: () => Promise<any>, operationId: string): Promise<any> {
    const attempts = this.retryAttempts.get(operationId) || 0;
    const isSilent = this.isSilentOperation(operationId);
    
    try {
      const result = await operation();
      this.retryAttempts.delete(operationId); // Reset on success
      return result;
    } catch (error) {
      if (error instanceof Error && (error.message?.includes('timed out') || error.message?.includes('timeout') || error.name === 'AbortError')) {
        if (!isSilent) {
          console.warn(`Operation ${operationId} timed out (attempt ${attempts + 1}/${this.maxRetries + 1})`);
        }
        
        if (attempts < this.maxRetries) {
          this.retryAttempts.set(operationId, attempts + 1);
          // Shorter delay for faster failure: 500ms
          const delay = 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.handleTimeoutError(operation, operationId);
        } else {
          if (!isSilent) {
            console.log(`Operation ${operationId} completed with fallback after ${this.maxRetries + 1} attempts`);
          }
          this.retryAttempts.delete(operationId);
          // Don't throw error for silent operations - let them handle gracefully
          if (isSilent) {
            throw new Error('SILENT_TIMEOUT');
          }
          throw new Error(`Operation timed out after ${this.maxRetries + 1} attempts. Please check your connection.`);
        }
      }
      throw error;
    }
  }

  // Handle network errors gracefully
  handleNetworkError(error: Error): Error {
    if (error.message?.includes('fetch') || error.message?.includes('Network')) {
      return new Error('Network connection issue. Please check your internet connection and try again.');
    }
    
    if (error.message?.includes('timed out')) {
      return new Error('Request timed out. Please try again with a better connection.');
    }
    
    return error;
  }

  // Reset retry attempts for a specific operation
  resetRetries(operationId: string): void {
    this.retryAttempts.delete(operationId);
  }

  // Reset all retry attempts
  resetAllRetries(): void {
    this.retryAttempts.clear();
  }

  // Add operation to silent list
  addSilentOperation(operationPattern: string): void {
    this.silentOperations.add(operationPattern);
  }

  // Remove operation from silent list
  removeSilentOperation(operationPattern: string): void {
    this.silentOperations.delete(operationPattern);
  }

  // Handle operation without retries (fail fast)
  async handleWithoutRetry(operation: () => Promise<any>, operationId: string): Promise<any> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && (error.message?.includes('timed out') || error.message?.includes('timeout') || error.name === 'AbortError')) {
        console.log(`Fast-fail operation ${operationId} timed out`);
        throw new Error('FAST_TIMEOUT');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();