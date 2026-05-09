import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { WifiOff, RefreshCw, ExternalLink } from 'lucide-react';

export function OfflineModeWarning() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'healthy' | 'down'>('checking');

  useEffect(() => {
    checkOfflineMode();
    checkBackendHealth();
  }, []);

  const checkOfflineMode = () => {
    const offlineFlag = localStorage.getItem('calico_offline_mode');
    setIsOfflineMode(offlineFlag === 'true');
  };

  const checkBackendHealth = async () => {
    try {
      // Firebase health check - no direct fetch needed
      // API calls now use Firebase Cloud Functions via httpsCallable
      const { apiClient } = await import('../../utils/api');
      const data = await apiClient.checkHealth();
      
      if (data && data.status === 'healthy') {
        setBackendHealth('healthy');
        return;
      }
      setBackendHealth('down');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendHealth('down');
    }
  };

  const disableOfflineMode = () => {
    localStorage.removeItem('calico_offline_mode');
    localStorage.removeItem('calico_offline_data');
    setIsOfflineMode(false);
    window.location.reload();
  };

  const refreshCheck = () => {
    setBackendHealth('checking');
    checkOfflineMode();
    checkBackendHealth();
  };

  if (!isOfflineMode && backendHealth === 'healthy') {
    return null; // Everything is fine
  }

  return (
    <div className="space-y-2 mb-4">
      {isOfflineMode && (
        <Alert className="bg-orange-50 border-orange-300">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Offline Mode Active</AlertTitle>
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p>
                The app is running in offline mode. All API calls are being intercepted 
                and returning mock data. This prevents communication with the backend.
              </p>
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={disableOfflineMode} 
                  size="sm" 
                  variant="outline"
                  className="border-orange-400 text-orange-700 hover:bg-orange-100"
                >
                  Disable Offline Mode
                </Button>
                <Button 
                  onClick={refreshCheck} 
                  size="sm" 
                  variant="ghost"
                  className="text-orange-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Check
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {backendHealth === 'down' && !isOfflineMode && (
        <Alert className="bg-red-50 border-red-300">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Backend Not Deployed</AlertTitle>
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p>
                Cannot reach the backend API server. User creation will not work until 
                the backend is deployed.
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono mt-2">
                firebase deploy --only functions
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={refreshCheck} 
                  size="sm" 
                  variant="outline"
                  className="border-red-400 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Check Again
                </Button>
                <Button 
                  onClick={() => window.open('OFFLINE_MODE_DISABLED_DEPLOY_NOW.md', '_blank')}
                  size="sm" 
                  variant="ghost"
                  className="text-red-700"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Deployment Guide
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {backendHealth === 'checking' && (
        <Alert className="bg-blue-50 border-blue-300">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-900">Checking Backend...</AlertTitle>
          <AlertDescription className="text-blue-800">
            Verifying backend server connection...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
