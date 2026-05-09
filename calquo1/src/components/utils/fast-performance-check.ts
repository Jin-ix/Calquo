// Fast, non-blocking performance check for app startup
export const fastPerformanceCheck = {
  // Quick device capability check
  isSlowDevice: (): boolean => {
    try {
      // Very basic checks that execute immediately
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 4;
      
      return cores < 4 || memory < 4;
    } catch {
      return false; // Default to normal performance
    }
  },

  // Quick network check
  isSlowNetwork: (): boolean => {
    try {
      const connection = (navigator as any).connection;
      if (!connection) return false;
      
      return connection.effectiveType === 'slow-2g' || 
             connection.effectiveType === '2g' ||
             connection.downlink < 1;
    } catch {
      return false;
    }
  },

  // Combined quick check
  shouldUsePerformanceMode: (): boolean => {
    return fastPerformanceCheck.isSlowDevice() || fastPerformanceCheck.isSlowNetwork();
  }
};

export default fastPerformanceCheck;