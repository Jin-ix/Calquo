import React, { useEffect, useState } from 'react';
import { useStock } from '../context/StockProvider';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, Database, Wifi, WifiOff } from 'lucide-react';

export function FirebaseStockStatus() {
  const { isFirebaseSync, allStock } = useStock();
  const [firebaseInfo, setFirebaseInfo] = useState<any>(null);

  useEffect(() => {
    async function checkFirebase() {
      try {
        const { isFirebaseDemoMode, firebaseDb, projectId } = await import('../../utils/firebase/config');
        setFirebaseInfo({
          isDemo: isFirebaseDemoMode,
          hasDb: !!firebaseDb,
          projectId: projectId || 'Unknown'
        });
      } catch (error) {
        console.error('Error checking Firebase:', error);
      }
    }
    checkFirebase();
  }, []);

  if (!firebaseInfo) return null;

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mb-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isFirebaseSync ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 font-medium">Firebase Real-time Sync Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700 font-medium">Using Local Data</span>
                </>
              )}
            </div>
            <div className="text-sm space-y-1">
              <div>Project: <span className="font-mono">{firebaseInfo.projectId}</span></div>
              <div>Demo Mode: {firebaseInfo.isDemo ? '✅ Yes' : '❌ No'}</div>
              <div>Database Connected: {firebaseInfo.hasDb ? '✅ Yes' : '❌ No'}</div>
              <div>Stock Items: <strong>{allStock.length}</strong></div>
              {isFirebaseSync && allStock.length === 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <strong className="text-amber-800">⚠️ No items in Firestore</strong>
                  <p className="text-xs text-amber-700 mt-1">
                    Add stock items through "Add Stock" form to see them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
