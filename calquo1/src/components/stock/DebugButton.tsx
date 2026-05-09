import React from 'react';
import { Button } from '../ui/button';

interface DebugButtonProps {
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DebugButton({ onClick, disabled, className, children }: DebugButtonProps) {
  const handleClick = async () => {
    console.log('🔘 DebugButton clicked!');
    console.log('Disabled:', disabled);
    console.log('Has onClick handler:', !!onClick);
    
    if (onClick && !disabled) {
      console.log('✅ Calling onClick handler...');
      try {
        await onClick();
        console.log('✅ onClick handler completed');
      } catch (error) {
        console.error('❌ onClick handler error:', error);
      }
    } else {
      console.log('❌ Button disabled or no onClick handler');
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
}
