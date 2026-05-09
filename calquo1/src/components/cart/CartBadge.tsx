import React from 'react';
import { useCart } from './CartProvider';
import { Badge } from '../ui/badge';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';

interface CartBadgeProps {
  onClick: () => void;
  className?: string;
}

export const CartBadge: React.FC<CartBadgeProps> = ({ onClick, className = '' }) => {
  const { cartSummary } = useCart();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`relative gap-2 ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {cartSummary.totalItems > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
        </Badge>
      )}
      <span className="hidden sm:inline">
        Cart{cartSummary.totalItems > 0 && ` (${cartSummary.totalItems})`}
      </span>
    </Button>
  );
};
