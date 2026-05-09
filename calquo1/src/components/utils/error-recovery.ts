// Error recovery utilities for Tex-App

export const errorRecovery = {
  // Clear all app data and restart
  clearAppData: () => {
    try {
      // Clear localStorage
      const keysToKeep = ['calico-theme', 'calico-language']; // Keep user preferences
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('App data cleared for recovery');
      return true;
    } catch (error) {
      console.error('Failed to clear app data:', error);
      return false;
    }
  },

  // Restart the app
  restartApp: () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to restart app:', error);
      // Fallback: redirect to root
      window.location.href = '/';
    }
  },

  // Diagnose common issues
  diagnoseIssues: () => {
    const issues = [];
    
    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      issues.push('localStorage not available');
    }
    
    // Check network
    if (!navigator.onLine) {
      issues.push('No network connection');
    }
    
    // Check for corrupted session data
    try {
      const user = localStorage.getItem('calico-user');
      if (user) {
        JSON.parse(user);
      }
    } catch (error) {
      issues.push('Corrupted user session data');
    }
    
    return issues;
  },

  // Auto-fix common issues
  autoFix: () => {
    const issues = errorRecovery.diagnoseIssues();
    let fixed = 0;
    
    issues.forEach(issue => {
      switch (issue) {
        case 'Corrupted user session data':
          try {
            localStorage.removeItem('calico-user');
            localStorage.removeItem('calico-session');
            fixed++;
          } catch (error) {
            console.error('Failed to fix session data:', error);
          }
          break;
      }
    });
    
    return { issues, fixed };
  },

  // Create error report
  createErrorReport: (error: Error, context?: string) => {
    // Suppress specific noise errors
    if (error.message?.includes('ColorPatternInput is not defined') || 
        error.message?.includes('XHR for') ||
        error.message?.includes('ReferenceError: ColorPatternInput') ||
        error.stack?.includes('ColorPatternInput') ||
        (error.name === 'ReferenceError' && error.message?.includes('ColorPatternInput'))) {
      return null;
    }

    const report = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: context || 'Unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      issues: errorRecovery.diagnoseIssues(),
      performance: {
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink
        } : null
      }
    };
    
    console.error('Error report created:', report);
    return report;
  }
};

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorRecovery.createErrorReport(event.error, 'Global error handler');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    errorRecovery.createErrorReport(new Error(event.reason), 'Unhandled promise rejection');
  });
}

export default errorRecovery;