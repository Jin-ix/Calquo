// Connection health monitoring utility
export class ConnectionHealth {
  private static instance: ConnectionHealth;
  private healthStatus: 'good' | 'poor' | 'offline' = 'good';
  private lastCheck = 0;
  private checkInterval = 30000; // 30 seconds
  private initialized = false;

  static getInstance(): ConnectionHealth {
    if (!ConnectionHealth.instance) {
      ConnectionHealth.instance = new ConnectionHealth();
    }
    return ConnectionHealth.instance;
  }

  async checkHealth(): Promise<'good' | 'poor' | 'offline'> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastCheck < 5000) {
      return this.healthStatus;
    }
    
    this.lastCheck = now;

    // Quick online check
    if (!navigator.onLine) {
      this.healthStatus = 'offline';
      return this.healthStatus;
    }

    try {
      // Use a simple method to test connectivity without external dependencies
      const startTime = Date.now();
      
      // Test with a minimal HEAD request to our own domain or a data URI
      const response = await fetch(window.location.origin + '/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok && latency < 500) {
        this.healthStatus = 'good';
      } else if (response.ok && latency < 1500) {
        this.healthStatus = 'poor';
      } else {
        this.healthStatus = 'poor';
      }
    } catch (error) {
      // Fallback to basic online status without logging errors
      this.healthStatus = navigator.onLine ? 'poor' : 'offline';
    }

    return this.healthStatus;
  }

  getStatus(): 'good' | 'poor' | 'offline' {
    return this.healthStatus;
  }

  // Get recommended timeout based on connection health
  getRecommendedTimeout(): number {
    // If not initialized yet, return conservative timeout
    if (!this.initialized) {
      this.initialized = true;
      return navigator.onLine ? 6000 : 2000;
    }
    
    switch (this.healthStatus) {
      case 'good':
        return 5000;  // 5 seconds for good connections
      case 'poor':
        return 10000; // 10 seconds for poor connections
      case 'offline':
        return 1000;  // 1 second for offline (immediate fallback)
      default:
        return 6000;  // Default fallback
    }
  }

  // Check if we should use offline mode
  shouldUseOfflineMode(): boolean {
    return this.healthStatus === 'offline' || this.healthStatus === 'poor';
  }
}

// Export singleton instance
export const connectionHealth = ConnectionHealth.getInstance();