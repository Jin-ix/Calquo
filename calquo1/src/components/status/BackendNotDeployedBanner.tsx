import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { X, AlertCircle, ExternalLink, Check } from 'lucide-react';

export function BackendNotDeployedBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has dismissed this banner before
    const dismissed = localStorage.getItem('backend-deploy-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Quick health check to see if backend is deployed
    const checkBackend = async () => {
      try {
        // Firebase health check - using Firebase Cloud Functions
        const { apiClient } = await import('../../utils/api');
        const data = await apiClient.checkHealth();

        if (data && data.status === 'healthy') {
          setIsBackendLive(true);
          setIsVisible(false);
        } else {
          setIsBackendLive(false);
          setIsVisible(true);
        }
      } catch (error) {
        // Backend not deployed - show banner
        setIsBackendLive(false);
        setIsVisible(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBackend();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('backend-deploy-banner-dismissed', 'true');
  };

  const handleOpenGuide = () => {
    window.open('/FIX_TIMEOUT_ERROR_NOW.md', '_blank');
  };

  if (isDismissed || !isVisible || isBackendLive) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-slide-down">
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 shadow-lg max-w-3xl mx-auto">
        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="flex items-center justify-between">
          <span className="text-orange-900 dark:text-orange-100">
            Backend Not Deployed - Quick 2-Minute Setup Needed
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-orange-800 dark:text-orange-200 text-sm">
            Your CALICO app is ready and uses Firebase for all backend functionality.
            No additional deployment needed - Firebase is already configured!
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                // Copy Firebase deployment commands
                const commands = `npm run build
firebase deploy`;
                navigator.clipboard.writeText(commands);
                alert('Firebase deployment commands copied! Paste them in your terminal.');
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Copy Deploy Commands
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-orange-600 text-orange-700 hover:bg-orange-50"
              onClick={handleOpenGuide}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Guide
            </Button>
          </div>

          <details className="text-xs text-orange-700 dark:text-orange-300 mt-2">
            <summary className="cursor-pointer hover:underline">
              Why is this needed?
            </summary>
            <p className="mt-2 ml-4">
              Figma Make cannot deploy Firebase Cloud Functions for security reasons.
              Your backend code is ready at <code>/functions/src/index.ts</code>,
              it just needs to be deployed once using the Firebase CLI.
            </p>
          </details>
        </AlertDescription>
      </Alert>
    </div>
  );
}
