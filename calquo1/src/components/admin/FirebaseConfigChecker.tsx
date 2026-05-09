import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

export function FirebaseConfigChecker() {
  // Mock check - in a real app this would check initializedApp
  const isConfigured = true;

  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">Firebase Configuration</span>
      </div>
      {isConfigured ? (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
           <CheckCircle className="h-3 w-3 mr-1" /> Valid
        </Badge>
      ) : (
        <Badge variant="destructive">
           <AlertTriangle className="h-3 w-3 mr-1" /> Missing
        </Badge>
      )}
    </div>
  );
}
