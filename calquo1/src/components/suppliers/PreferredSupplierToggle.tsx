import React from 'react';
import { Button } from '../ui/button';
import { Heart, HeartOff } from 'lucide-react';

interface PreferredSupplierToggleProps {
  supplierId: string;
  supplierName: string;
  isPreferred: boolean;
  onToggle: (supplierId: string) => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

interface PreferredSupplierHeaderProps {
  supplierId: string;
  supplierName: string;
  isPreferred: boolean;
  onToggle: (supplierId: string) => void;
}

export function PreferredSupplierToggle({
  supplierId,
  supplierName,
  isPreferred,
  onToggle,
  variant = 'button',
  size = 'md'
}: PreferredSupplierToggleProps) {
  const handleClick = () => {
    onToggle(supplierId);
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleClick}
        className={isPreferred ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-red-600'}
        title={isPreferred ? `Remove ${supplierName} from preferred suppliers` : `Add ${supplierName} to preferred suppliers`}
      >
        {isPreferred ? (
          <Heart className="h-4 w-4 fill-current" />
        ) : (
          <HeartOff className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isPreferred ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      className={isPreferred ? 'bg-red-600 hover:bg-red-700' : ''}
    >
      {isPreferred ? (
        <>
          <Heart className="h-4 w-4 mr-2 fill-current" />
          Remove from Preferred
        </>
      ) : (
        <>
          <HeartOff className="h-4 w-4 mr-2" />
          Add to Preferred
        </>
      )}
    </Button>
  );
}

export function PreferredSupplierHeader({
  supplierId,
  supplierName,
  isPreferred,
  onToggle
}: PreferredSupplierHeaderProps) {
  return (
    <PreferredSupplierToggle
      supplierId={supplierId}
      supplierName={supplierName}
      isPreferred={isPreferred}
      onToggle={onToggle}
      variant="icon"
      size="sm"
    />
  );
}
