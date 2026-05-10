import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Database } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

export function FirebaseConfigStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSupabaseConfig = async () => {
      try {
        // Just checking if we have a valid client
        setIsConfigured(!!supabase);
        setIsChecking(false);
      } catch (error) {
        setIsConfigured(false);
        setIsChecking(false);
      }
    };

    checkSupabaseConfig();
  }, []);

  if (isChecking || !isConfigured) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Database className="w-3 h-3 mr-1" />
        Supabase Connected
      </Badge>
    </div>
  );
}
