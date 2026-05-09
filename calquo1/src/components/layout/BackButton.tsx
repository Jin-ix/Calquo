import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Home, ChevronLeft } from 'lucide-react';
import { cn } from '../ui/utils';

interface BackButtonProps {
  onBack: () => void;
  label?: string;
  showHomeOption?: boolean;
  onHome?: () => void;
  variant?: 'default' | 'ghost' | 'minimal';
  className?: string;
}

export function BackButton({ 
  onBack, 
  label = 'Back', 
  showHomeOption = true,
  onHome,
  variant = 'default',
  className 
}: BackButtonProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 mb-6", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-1 h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border" />
        {showHomeOption && onHome && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            className="p-1 h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 mb-6", className)}>
      <Button
        variant={variant === 'ghost' ? 'ghost' : 'outline'}
        size="sm"
        onClick={onBack}
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          variant === 'ghost' && "hover:bg-primary/5"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
      
      {showHomeOption && onHome && (
        <>
          <div className="h-4 w-px bg-border/60" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </>
      )}
    </div>
  );
}

// Breadcrumb-style back button for complex navigation paths
interface BreadcrumbBackButtonProps {
  paths: Array<{
    label: string;
    action: () => void;
    current?: boolean;
  }>;
  className?: string;
}

export function BreadcrumbBackButton({ paths, className }: BreadcrumbBackButtonProps) {
  return (
    <div className={cn("flex items-center gap-2 mb-6 text-sm", className)}>
      {paths.map((path, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronLeft className="h-3 w-3 text-muted-foreground rotate-180" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={path.action}
            disabled={path.current}
            className={cn(
              "h-8 px-2 text-sm transition-colors",
              path.current 
                ? "text-primary font-medium cursor-default hover:bg-transparent" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {path.label}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
}
