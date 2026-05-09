import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ChevronRight, X, Menu, ArrowLeft } from 'lucide-react';
import { cn } from '../ui/utils';

interface NavigationHintProps {
  onSidebarInteraction?: () => void;
}

export function NavigationHint({ onSidebarInteraction }: NavigationHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Check if user has seen the hint before
    const hasSeenHint = localStorage.getItem('calico-navigation-hint-seen');
    const interactionCount = parseInt(localStorage.getItem('calico-sidebar-interactions') || '0');
    
    // Show hint if user hasn't seen it and hasn't interacted much with sidebar
    if (!hasSeenHint && interactionCount < 3) {
      // Show hint after a brief delay to let the page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        startAnimationCycle();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startAnimationCycle = () => {
    const animationInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 3);
    }, 1500);

    // Clean up after 10 seconds if not dismissed
    setTimeout(() => {
      clearInterval(animationInterval);
      if (isVisible) {
        handleDismiss();
      }
    }, 10000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('calico-navigation-hint-seen', 'true');
  };

  const handleSidebarDiscovered = () => {
    setHasInteracted(true);
    const currentCount = parseInt(localStorage.getItem('calico-sidebar-interactions') || '0');
    localStorage.setItem('calico-sidebar-interactions', (currentCount + 1).toString());
    
    if (onSidebarInteraction) {
      onSidebarInteraction();
    }
    
    // Hide hint after a few interactions
    if (currentCount >= 2) {
      handleDismiss();
    }
  };

  // Listen for mouse movement near left edge to detect sidebar discovery
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 50 && isVisible && !hasInteracted) {
        handleSidebarDiscovered();
      }
    };

    if (isVisible) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isVisible, hasInteracted]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none" />
      
      {/* Navigation Hint Container */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex items-center gap-3">
        {/* Animated Arrow Sequence */}
        <div className="flex items-center gap-1">
          {/* Multiple arrows with staggered animation */}
          {[0, 1, 2].map((index) => (
            <ArrowLeft
              key={index}
              className={cn(
                "h-6 w-6 text-primary transition-all duration-500 nav-hint-arrow",
                animationPhase === index 
                  ? "opacity-100 scale-110 translate-x-0" 
                  : "opacity-30 scale-90 translate-x-1"
              )}
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>

        {/* Hint Card */}
        <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Menu className="h-5 w-5" />
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-sm">Navigation Menu</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Move your cursor to the left edge of the screen to access the navigation menu with all app features.
              </p>
              
              {/* Visual indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-8 bg-gradient-to-r from-primary/50 to-transparent rounded-r-full animate-pulse" />
                <span>Hover here</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={handleDismiss}
            >
              Got it
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground"
              onClick={() => {
                handleSidebarDiscovered();
                // Simulate sidebar trigger
                const event = new MouseEvent('mousemove', {
                  clientX: 25,
                  clientY: window.innerHeight / 2
                });
                document.dispatchEvent(event);
              }}
            >
              Try it now
            </Button>
          </div>
        </div>
      </div>

      {/* Animated pulse indicator on the edge */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <div className="w-1 h-16 bg-gradient-to-b from-transparent via-primary to-transparent opacity-60 animate-pulse" />
        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-primary rounded-full animate-ping" />
      </div>

      {/* Mobile-specific hint */}
      <div className="fixed top-20 left-4 z-50 md:hidden">
        <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              Tap the left edge to open menu
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-auto"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
