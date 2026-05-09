import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Activity, Wifi, Database, CheckCircle2 } from 'lucide-react';

export function SystemHealthSummary() {
  return (
    <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-2 bg-green-100 rounded-full">
             <Activity className="h-5 w-5 text-green-600" />
           </div>
           <div>
             <h3 className="font-medium text-sm">System Status</h3>
             <p className="text-xs text-muted-foreground">All systems operational</p>
           </div>
        </div>
        <div className="hidden md:flex gap-6 text-sm">
           <div className="flex items-center gap-2">
             <Wifi className="h-4 w-4 text-green-500" />
             <span className="text-muted-foreground">Network</span>
           </div>
           <div className="flex items-center gap-2">
             <Database className="h-4 w-4 text-green-500" />
             <span className="text-muted-foreground">Database</span>
           </div>
           <div className="flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4 text-green-500" />
             <span className="text-muted-foreground">Services</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
