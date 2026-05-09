// Startup optimization utility to prevent getPage timeouts and improve loading
class StartupOptimizer {
  private static instance: StartupOptimizer;
  private isOptimizing = false;
  private startTime = Date.now();
  private readonly MAX_STARTUP_TIME = 30000; // 30 seconds max - increased for slower connections
  
  private constructor() {
    this.initializeOptimizations();
  }

  static getInstance(): StartupOptimizer {
    if (!StartupOptimizer.instance) {
      StartupOptimizer.instance = new StartupOptimizer();
    }
    return StartupOptimizer.instance;
  }

  private initializeOptimizations() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;

    // Optimize React lazy loading
    this.optimizeLazyLoading();
    
    // Optimize network requests
    this.optimizeNetworkRequests();
    
    // Monitor startup time
    this.monitorStartupTime();
    
    // Set emergency fallback
    this.setEmergencyFallback();
  }

  private optimizeLazyLoading() {
    // Preload critical components
    const criticalModules = [
      () => import('../auth/LoginForm'),
      () => import('../AppMainWrapper')
    ];

    // Start preloading but don't wait for them
    criticalModules.forEach(moduleLoader => {
      moduleLoader().catch(error => {
        console.warn('StartupOptimizer: Failed to preload module:', error);
      });
    });
  }

  private optimizeNetworkRequests() {
    // Set aggressive timeouts for fetch requests during startup
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      const [resource, config = {}] = args;
      
      // Add shorter timeout for startup phase
      const optimizedConfig = {
        ...config,
        signal: config.signal || AbortSignal.timeout(10000) // 10 second timeout
      };

      return originalFetch(resource, optimizedConfig);
    };

    // Restore original fetch after startup
    setTimeout(() => {
      window.fetch = originalFetch;
    }, this.MAX_STARTUP_TIME);
  }

  private monitorStartupTime() {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      
      // Check if app has loaded successfully first
      if (document.querySelector('[data-app-loaded="true"]') || document.querySelector('[data-auth-ready="true"]')) {
        console.log(`StartupOptimizer: App loaded successfully in ${elapsed}ms`);
        this.isOptimizing = false;
        clearInterval(checkInterval);
        return;
      }
      
      // Only trigger fallback if really stuck (beyond max time)
      if (elapsed > this.MAX_STARTUP_TIME) {
        console.warn('StartupOptimizer: Startup taking longer than expected');
        // Don't auto-trigger fallback, just log warning
        // User can manually reload if needed
        clearInterval(checkInterval);
      }
    }, 2000); // Check every 2 seconds instead of 1 second
  }

  private setEmergencyFallback() {
    // Disabled - let the app load naturally without forced fallbacks
    // Users can manually reload if needed
    setTimeout(() => {
      if (this.isOptimizing) {
        console.info('StartupOptimizer: App still loading... (this is normal for slow connections)');
        this.isOptimizing = false; // Stop optimization tracking
      }
    }, this.MAX_STARTUP_TIME + 10000); // 40 seconds - just log, don't reload
  }

  private triggerFallback() {
    // This method is now deprecated and not used
    // Keeping for backwards compatibility but it won't auto-reload
    console.info('StartupOptimizer: Fallback triggered (no action taken)');
  }

  private showFallbackUI() {
    const fallbackHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fef7ff;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; max-width: 400px; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
          <h2 style="color: #2d1b3d; margin-bottom: 10px;">CALICO Loading</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">
            The app is taking longer than expected. Reloading automatically...
          </p>
          <button onclick="window.location.reload()" style="
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">
            Reload Now
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', fallbackHTML);
  }

  public markAppLoaded() {
    this.isOptimizing = false;
    document.body.setAttribute('data-app-loaded', 'true');
    console.log(`StartupOptimizer: App marked as loaded in ${Date.now() - this.startTime}ms`);
  }

  public getStartupTime() {
    return Date.now() - this.startTime;
  }
}

// Export singleton
export const startupOptimizer = StartupOptimizer.getInstance();

// Auto-initialize
if (typeof window !== 'undefined') {
  startupOptimizer; // Just accessing it starts the optimization
}