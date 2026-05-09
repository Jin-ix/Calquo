import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Download, Smartphone, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { safeAddEventListener } from '../utils/timeout-protection';
import { simpleTimeout } from '../utils/simple-timeout';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after user has used the app for a bit
      setTimeout(() => {
        try {
          if (!isStandalone && !sessionStorage.getItem('pwa-install-dismissed')) {
            setShowInstallPrompt(true);
          }
        } catch (error) {
          console.warn('PWA install prompt error:', error);
        }
      }, 10000); // Show after 10 seconds instead of 30
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('CALICO installed successfully!');
    };

    // Service worker update detection
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
      toast.info('App update available', {
        description: 'A new version is ready to install',
        action: {
          label: 'Update',
          onClick: () => handleUpdate()
        }
      });
    };

    const cleanupBeforeInstall = safeAddEventListener(window, 'beforeinstallprompt', handleBeforeInstallPrompt);
    const cleanupAppInstalled = safeAddEventListener(window, 'appinstalled', handleAppInstalled);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);
      } catch (error) {
        console.warn('Service worker event listener error:', error);
      }
    }

    return () => {
      cleanupBeforeInstall();
      cleanupAppInstalled();
      mediaQuery.removeEventListener('change', checkStandalone);
      
      if ('serviceWorker' in navigator) {
        try {
          navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
        } catch (error) {
          console.warn('Service worker cleanup error:', error);
        }
      }
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('Installing CALICO...');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      const updatePromise = navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      
      simpleTimeout(
        updatePromise,
        5000,
        'Service worker update timed out'
      ).catch((error) => {
        console.warn('Service worker update error:', error);
        toast.error('Update failed. Please try again.');
      });
    }
    setUpdateAvailable(false);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show install prompt if already dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setShowInstallPrompt(false);
    }
  }, []);

  // Install prompt component
  if (showInstallPrompt && deferredPrompt && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1">Install Tex-App</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get the full app experience with offline access and quick launch from your home screen.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissInstallPrompt}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update available component
  if (updateAvailable) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <Card className="border-blue-500/20 shadow-lg bg-blue-50/90 dark:bg-blue-950/90">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1">Update Available</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  A new version of Tex-App is ready to install.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Update Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateAvailable(false)}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook to check if app is running as PWA
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsPWA(isStandaloneMode);
    };

    checkPWA();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => {
      mediaQuery.removeEventListener('change', checkPWA);
    };
  }, []);

  return isPWA;
}

// Component to show PWA-specific features
export function PWAFeatures() {
  const isPWA = useIsPWA();

  if (!isPWA) return null;

  return (
    <div className="fixed top-2 left-2 z-40">
      <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
        PWA Mode
      </div>
    </div>
  );
}
