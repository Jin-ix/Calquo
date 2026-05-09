import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, CheckCircle, Database, ExternalLink, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export function FirebaseConfigStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [configDetails, setConfigDetails] = useState<any>(null);

  useEffect(() => {
    const checkFirebaseConfig = async () => {
      try {
        const { isFirebaseDemoMode, firebaseDb, projectId } = await import('../../utils/firebase/config');
        
        setIsConfigured(!isFirebaseDemoMode && !!firebaseDb);
        setConfigDetails({
          isDemoMode: isFirebaseDemoMode,
          hasDb: !!firebaseDb,
          projectId: projectId
        });
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking Firebase config:', error);
        setIsConfigured(false);
        setIsChecking(false);
      }
    };

    checkFirebaseConfig();
  }, []);

  if (isChecking) {
    return null;
  }

  // Don't show anything if Firebase is properly configured
  if (isConfigured) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Database className="w-3 h-3 mr-1" />
          Firebase Connected
        </Badge>
      </div>
    );
  }

  // Show warning if not configured
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-orange-900 font-semibold">
          Firebase Not Configured - Using Demo Data
        </AlertTitle>
        <AlertDescription className="text-orange-800 space-y-2">
          <p className="text-sm">
            Your app is currently using demo data. To fetch real data from Firestore:
          </p>
          <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
            <li>Open the <code className="bg-orange-100 px-1 rounded">/firebase-credentials.ts</code> file</li>
            <li>Replace placeholder values with your Firebase project config</li>
            <li>Get your config from <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 underline hover:text-orange-700 inline-flex items-center gap-1"
            >
              Firebase Console
              <ExternalLink className="w-3 h-3" />
            </a></li>
            <li>Reload the app</li>
          </ol>
          
          {configDetails && (
            <div className="text-xs mt-2 p-2 bg-orange-100 rounded">
              <strong>Status:</strong> Demo Mode (projectId: {configDetails.projectId})
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
