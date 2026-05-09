import React from 'react';
import { CategoryManager } from './CategoryManager';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

interface CategoryManagerStandaloneProps {
  onBack?: () => void;
}

export function CategoryManagerStandalone({ onBack }: CategoryManagerStandaloneProps) {
  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
      )}
      <CategoryManager />
    </div>
  );
}
