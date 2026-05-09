import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

export function OnlineStatusBanner() {
  const { isOnline, lastOffline, lastOnline } = useOnlineStatus();

  // Don't show banner if online
  if (isOnline) {
    return null;
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative overflow-hidden mb-6"
        >
          {/* Animated red glow background */}
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/10 blur-xl rounded-full"
          />

          <Alert className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-lg relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-white/40 mix-blend-overlay pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              <motion.div
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="bg-red-100 p-2 rounded-full shadow-inner"
              >
                <WifiOff className="h-6 w-6 text-red-600 drop-shadow-sm" />
              </motion.div>

              <div className="flex-1">
                <AlertTitle className="text-red-900 font-bold text-lg tracking-tight mb-1">
                  No Internet Connection
                </AlertTitle>
                <AlertDescription className="text-red-800/90 text-sm md:text-base">
                  <div className="space-y-2">
                    <p className="font-medium leading-relaxed">
                      You're currently offline. Backend synchronization is paused until connection is restored.
                    </p>
                    {lastOffline && (
                      <p className="text-xs font-semibold bg-red-100/50 inline-block px-2 py-1 rounded text-red-700">
                        Last online: {formatTime(lastOffline)}
                      </p>
                    )}
                    <div className="pt-2">
                      <p className="text-sm font-semibold mb-1 text-red-900 border-b border-red-200/50 pb-1">
                        Limited functionality:
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 text-xs font-medium">
                        <li className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500" /> Cannot create/update users</li>
                        <li className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500" /> Cannot sync database</li>
                        <li className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500" /> API calls disabled</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-orange-500" /> View-only existing data</li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>

            {/* Edge highlight line */}
            <motion.div
              className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 w-full"
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            />
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OnlineStatusIndicator() {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700">Online</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700">Offline</span>
        </>
      )}
    </div>
  );
}
