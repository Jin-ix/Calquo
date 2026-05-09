import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ConnectionStatus {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface ConnectionMonitorProps {
  showNotifications?: boolean;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function ConnectionMonitor({ 
  showNotifications = true,
  onStatusChange 
}: ConnectionMonitorProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    online: navigator.onLine
  });
  const [wasOffline, setWasOffline] = useState(false);

  const updateConnectionStatus = () => {
    const connection = (navigator as any).connection;
    
    const status: ConnectionStatus = {
      online: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    };

    setConnectionStatus(status);
    if (onStatusChange) {
      onStatusChange(status);
    }

    console.log('ConnectionMonitor: Status updated', status);

    // Show notifications for status changes
    if (showNotifications) {
      if (!status.online && !wasOffline) {
        toast.error('No internet connection', {
          description: 'Some features may not work properly',
          duration: 5000,
        });
        setWasOffline(true);
      } else if (status.online && wasOffline) {
        toast.success('Internet connection restored', {
          description: 'All features are now available',
          duration: 3000,
        });
        setWasOffline(false);
      } else if (status.online && status.effectiveType === 'slow-2g') {
        toast.warning('Slow connection detected', {
          description: 'Loading may take longer than usual',
          duration: 4000,
        });
      }
    }
  };

  useEffect(() => {
    // Initial status
    updateConnectionStatus();

    // Listen for online/offline events
    const handleOnline = () => updateConnectionStatus();
    const handleOffline = () => updateConnectionStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionStatus);
    }

    // Lightweight connection quality check
    const checkConnection = async () => {
      if (!navigator.onLine) {
        return;
      }

      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Try to fetch a small local resource first
        await fetch('/manifest.json', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (responseTime > 3000) {
          console.log(`ConnectionMonitor: Slow response detected (${responseTime}ms)`);
        } else {
          console.log(`ConnectionMonitor: Connection quality good (${responseTime}ms)`);
        }
      } catch (error) {
        // Silently handle errors to avoid console noise
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('ConnectionMonitor: Using fallback connection detection');
        }
      }
    };

    // Disable periodic quality checks to avoid fetch errors
    // Only check on network state changes
    let qualityInterval: NodeJS.Timeout | null = null;
    
    // Only enable quality checks in production and if specifically needed
    if (process.env.NODE_ENV === 'production' && false) {
      qualityInterval = setInterval(() => {
        if (navigator.onLine) {
          checkConnection();
        }
      }, 600000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
      if (qualityInterval) {
        clearInterval(qualityInterval);
      }
    };
  }, [showNotifications, wasOffline]);

  // Don't render anything - this is just a monitoring component
  return null;
}

// Hook to get current connection status
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>({
    online: navigator.onLine
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection;
      
      setStatus({
        online: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });
    };

    updateStatus();

    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}

// Component to display connection status indicator
export function ConnectionStatusIndicator() {
  const status = useConnectionStatus();

  if (status.online) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 px-4 text-sm font-medium z-50">
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        No Internet Connection
      </div>
    </div>
  );
}
