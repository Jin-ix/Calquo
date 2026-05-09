import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

interface DebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  debugLabel?: string;
}

export function DebugDialog({ open, onOpenChange, title, description, children, debugLabel = 'Dialog' }: DebugDialogProps) {
  useEffect(() => {
    console.log(`🔷 ${debugLabel} open state changed:`, open);
  }, [open, debugLabel]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log(`🔷 ${debugLabel} onOpenChange called:`, newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {console.log(`🎨 ${debugLabel} content rendering`)}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
