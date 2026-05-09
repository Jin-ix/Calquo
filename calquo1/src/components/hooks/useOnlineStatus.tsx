import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface OnlineStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Default to true (online) - optimistic approach
    if (typeof navigator !== 'undefined') {
      return navigator.onLine !== false; // true unless explicitly false
    }
    return true;
  });

  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [lastOffline, setLastOffline] = useState<Date | null>(null);

  useEffect(() => {
    console.log('🌐 Online Status Hook Initialized');
    console.log('📡 Initial navigator.onLine:', navigator.onLine);
    console.log('✅ Online mode: API calls direct to backend');

    const handleOnline = () => {
      console.log('🟢 Network Status: ONLINE');
      console.log('✅ Bypassing cache for all API calls');
      setIsOnline(true);
      setLastOnline(new Date());
      
      toast.success('Back online!', {
        description: 'Syncing with backend server...',
        duration: 3000
      });
    };

    const handleOffline = () => {
      console.log('🔴 Network Status: OFFLINE');
      console.warn('⚠️ No network connection - API calls will fail');
      setIsOnline(false);
      setLastOffline(new Date());
      
      toast.error('Network connection lost', {
        description: 'Some features may not work until connection is restored.',
        duration: 5000
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      console.log('✅ Initial state: ONLINE - Direct backend communication enabled');
    } else {
      console.warn('⚠️ Initial state: OFFLINE - Limited functionality');
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    lastOnline,
    lastOffline,
    status: {
      isOnline,
      lastOnline,
      lastOffline
    } as OnlineStatus
  };
}
