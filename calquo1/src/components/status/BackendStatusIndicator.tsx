import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Server } from 'lucide-react';
import { systemAPI } from '../../utils/api';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';

export function BackendStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await systemAPI.checkHealth();
      if (response && response.status === 'healthy') {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    }
    setLastCheck(new Date());
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'offline':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      case 'checking':
        return <Server className="h-4 w-4 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'checking':
        return 'Checking...';
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          onClick={checkStatus}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm">
            <Server className="h-4 w-4" />
            Backend Server Status
          </h4>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={status === 'online' ? 'text-green-600' : 'text-red-600'}>
                {getStatusText()}
              </span>
            </div>
            
            {lastCheck && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last checked:</span>
                <span className="text-xs">
                  {lastCheck.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {status === 'offline' && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4" />
                Backend Not Deployed
              </p>
              <p className="text-xs text-amber-700">
                The backend server needs to be deployed using:
              </p>
              <code className="mt-2 block rounded bg-gray-900 p-2 text-xs text-green-400">
                firebase deploy --only functions
              </code>
              <p className="mt-2 text-xs text-amber-700">
                See <code className="rounded bg-amber-100 px-1">/QUICK_DEPLOYMENT_FIX.md</code> for details.
              </p>
            </div>
          )}

          {status === 'online' && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="flex items-center gap-2 text-sm text-green-900">
                <CheckCircle className="h-4 w-4" />
                All systems operational
              </p>
              <p className="mt-1 text-xs text-green-700">
                Backend API is responding normally.
              </p>
            </div>
          )}

          <button
            onClick={checkStatus}
            disabled={status === 'checking'}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {status === 'checking' ? 'Checking...' : 'Recheck Status'}
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
