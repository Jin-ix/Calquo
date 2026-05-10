import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { supabase } from '../../utils/supabase/client';

export function FirebaseConfigChecker() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        // Lightweight ping: fetch 1 row from companies
        const { error } = await supabase.from('companies').select('id').limit(1);
        setStatus(error ? 'error' : 'ok');
      } catch {
        setStatus('error');
      }
    };
    check();
  }, []);

  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-400 animate-pulse'}`} />
        <span className="text-sm font-medium">Supabase Connection</span>
      </div>
      {status === 'checking' && (
        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking
        </Badge>
      )}
      {status === 'ok' && (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          <CheckCircle className="h-3 w-3 mr-1" /> Connected
        </Badge>
      )}
      {status === 'error' && (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" /> Error
        </Badge>
      )}
    </div>
  );
}

