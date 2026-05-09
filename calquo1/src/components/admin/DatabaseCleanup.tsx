import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function DatabaseCleanup() {
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    // Simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCleaning(false);
    toast.success('Database cleanup completed successfully');
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Perform maintenance tasks to keep the database optimized.
      </div>
      
      <div className="flex flex-col gap-3">
        <Button 
          variant="outline" 
          onClick={handleCleanup}
          disabled={isCleaning}
          className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Clean Old Logs (30+ days)
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleCleanup}
          disabled={isCleaning}
          className="justify-start"
        >
          {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Search Indexes
        </Button>
      </div>
    </div>
  );
}
