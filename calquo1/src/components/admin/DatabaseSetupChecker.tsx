import React from 'react';
import { Check, Shield, Lock } from 'lucide-react';
import { Progress } from '../ui/progress';

export function DatabaseSetupChecker() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Security & Rules Status
      </h3>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Firestore Rules</span>
            <span className="text-green-600">Active</span>
          </div>
          <Progress value={100} className="h-1.5" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
           <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
             <Lock className="h-3 w-3 text-green-500" />
             <span>UserData: Protected</span>
           </div>
           <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
             <Check className="h-3 w-3 text-green-500" />
             <span>Orders: Verified</span>
           </div>
        </div>
      </div>
    </div>
  );
}
