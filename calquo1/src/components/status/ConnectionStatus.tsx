import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({ className, showText = false }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastConnected(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial connection time if online
    if (navigator.onLine) {
      setLastConnected(new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    if (!showText) return null;
    
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn("text-red-600 border-red-200", className)}
    >
      <WifiOff className="w-3 h-3 mr-1" />
      {showText ? 'Offline' : ''}
    </Badge>
  );
}

// Enhanced connection monitor with API status
export function APIConnectionStatus({ className }: { className?: string }) {
  const [apiStatus, setApiStatus] = useState<'connected' | 'slow' | 'error'>('connected');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const start = Date.now();
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;

        if (response.ok) {
          setApiStatus(duration > 3000 ? 'slow' : 'connected');
        } else {
          setApiStatus('error');
        }
        setLastCheck(new Date());
      } catch (error) {
        setApiStatus('error');
        setLastCheck(new Date());
      }
    };

    // Check immediately
    checkAPIStatus();

    // Check every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (apiStatus) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'secondary' as const,
          color: 'text-green-600'
        };
      case 'slow':
        return {
          icon: AlertCircle,
          text: 'Slow Connection',
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection Issues',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <Badge 
      variant={status.variant}
      className={cn(status.color, "border opacity-75", className)}
      title={`Last checked: ${lastCheck.toLocaleTimeString()}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status.text}
    </Badge>
  );
}
