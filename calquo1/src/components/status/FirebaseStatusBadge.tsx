/**
 * Firebase Status Badge
 * Small visual indicator showing whether Firebase is connected
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Cloud, CloudOff, HelpCircle } from 'lucide-react';
import { projectId } from '../../utils/firebase/config';

type FirebaseStatus = 'connected' | 'demo' | 'unknown';

export functioon FirebaseStatusBadge() {
  const [status, setStatus] = useState<FirebaseStatus>('unknown');

  useEffect(() => {
    // Check if Firebase is properly configured
    if (projectId && projectId !== 'calico-demo') {
      setStatus('connected');
    } else {
      setStatus('demo');
    }
  }, []);

  // Don't show in production to keep UI clean
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return null;
  }

  if (status === 'connected') {
    return (
      <Badge 
        variant="outline" 
        className="bg-green-50 text-green-700 border-green-200 text-xs gap-1"
      >
        <Cloud className="h-3 w-3" />
        Firebase
      </Badge>
    );
  }

  if (status === 'demo') {
    return (
      <Badge 
        variant="outline" 
        className="bg-orange-50 text-orange-700 border-orange-200 text-xs gap-1"
      >
        <CloudOff className="h-3 w-3" />
        Demo Mode
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-gray-50 text-gray-700 border-gray-200 text-xs gap-1"
    >
      <HelpCircle className="h-3 w-3" />
      Checking...
    </Badge>
  );
}

// Detailed status component for settings/admin page
export function FirebaseStatusDetailed() {
  const [status, setStatus] = useState<FirebaseStatus>('unknown');

  useEffect(() => {
    if (projectId && projectId !== 'calico-demo') {
      setStatus('connected');
    } else {
      setStatus('demo');
    }
  }, []);

  if (status === 'connected') {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Cloud className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-green-900">Connected to Firebase</p>
          <p className="text-sm text-green-700 mt-1">
            Project: <code className="bg-green-100 px-2 py-0.5 rounded">{projectId}</code>
          </p>
          <p className="text-sm text-green-700 mt-1">
            Your data is securely stored in the cloud with real-time sync.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'demo') {
    return (
      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <CloudOff className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-orange-900">Demo Mode</p>
          <p className="text-sm text-orange-700 mt-1">
            Using local storage only. Data will be lost when cache is cleared.
          </p>
          <p className="text-sm text-orange-700 mt-2">
            To enable Firebase:
          </p>
          <ol className="text-sm text-orange-700 mt-1 space-y-1 list-decimal list-inside ml-2">
            <li>Create <code className="bg-orange-100 px-1 py-0.5 rounded">.env.local</code> with Firebase credentials</li>
            <li>Run <code className="bg-orange-100 px-1 py-0.5 rounded">npm run dev</code> to restart</li>
          </ol>
          <p className="text-sm text-orange-700 mt-2">
            See <code className="bg-orange-100 px-1 py-0.5 rounded">FIREBASE_QUICK_START.txt</code> for instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <HelpCircle className="h-5 w-5 text-gray-600" />
      <span className="text-sm text-gray-700">Checking Firebase connection...</span>
    </div>
  );
}
