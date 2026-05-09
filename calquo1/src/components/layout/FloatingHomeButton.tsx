import React from 'react';
import { Button } from '../ui/button';
import { Home, Sparkles } from 'lucide-react';
import { cn } from '../ui/utils';

interface FloatingHomeButtonProps {
  onHomeClick: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
}

export function FloatingHomeButton({ 
  onHomeClick, 
  className, 
  variant = 'floating' 
}: FloatingHomeButtonProps) {
  
  if (variant === 'minimal') {
    return (
      <div className={cn("absolute top-4 right-4 z-50", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHomeClick}
          className="h-9 w-9 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
          title="Go to Home"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className={cn("absolute top-4 right-4 z-50", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={onHomeClick}
          className="flex items-center gap-2 bg-card/95 backdrop-blur-sm hover:bg-card shadow-lg border-primary/20"
          title="Go to Home"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
      </div>
    );
  }

  // Floating variant (default)
  return (
    <div className={cn("fixed top-20 right-6 z-50", className)}>
      <Button
        variant="default"
        size="sm"
        onClick={onHomeClick}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "border-2 border-primary/20 hover:border-primary/40",
          "floating-home-enter floating-home-pulse floating-home-bounce",
          "group relative overflow-hidden"
        )}
        title="Go to Home"
      >
        {/* Background sparkle effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-3 w-3 absolute top-1 right-1 home-sparkle text-primary-foreground/60" style={{ animationDelay: '0s' }} />
          <Sparkles className="h-2 w-2 absolute bottom-1.5 left-1.5 home-sparkle text-primary-foreground/40" style={{ animationDelay: '1s' }} />
          <Sparkles className="h-2.5 w-2.5 absolute top-2 left-2 home-sparkle text-primary-foreground/50" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Main home icon */}
        <Home className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 relative z-10" />
        
        {/* Ripple effect on hover */}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      </Button>
    </div>
  );
}

// Alternative compact version for mobile
export function CompactHomeButton({ 
  onHomeClick, 
  className 
}: { onHomeClick: () => void; className?: string }) {
  return (
    <div className={cn("fixed top-4 right-4 z-30 md:hidden", className)}>
      <Button
        variant="default"
        size="sm"
        onClick={onHomeClick}
        className={cn(
          "h-10 w-10 rounded-full shadow-md",
          "bg-primary/90 hover:bg-primary text-primary-foreground",
          "backdrop-blur-sm"
        )}
        title="Go to Home"
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
}
