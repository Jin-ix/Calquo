import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, Database, Wifi, WifiOff, XCircle } from 'lucide-react';

interface ConnectionStatus {
  firebaseConfigured: boolean;
  firestoreConnected: boolean;
  userAuthenticated: boolean;
  userData: {
    uid?: string;
    email?: string;
    company?: string;
  } | null;
}

export function FirestoreConnectionSuccess() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { 
        isFirebaseDemoMode, 
        firebaseAuth, 
        firebaseDb 
      } = await import('../../utils/firebase/config');

      const currentUser = firebaseAuth?.currentUser;

      setStatus({
        firebaseConfigured: !isFirebaseDemoMode && !!firebaseDb,
        firestoreConnected: !!firebaseDb,
        userAuthenticated: !!currentUser,
        userData: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          company: currentUser.displayName || undefined
        } : null
      });
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  if (!status || !visible) {
    return null;
  }

  // Only show if everything is working
  if (!status.firebaseConfigured || !status.firestoreConnected || !status.userAuthenticated) {
    return null;
  }

  return (
    null
  );
}

export function CORSErrorsNotice() {
  return null;
}
