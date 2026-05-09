import React, { useState, useEffect } from 'react';
import { useEssentialHealth } from '../debug/EssentialHealthMonitor';

interface SystemStatusIndicatorProps {
  showOnlyIssues?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function SystemStatusIndicator({ 
  showOnlyIssues = true,
  position = 'top-right' 
}: SystemStatusIndicatorProps) {
  const { localStorage, network, isHealthy } = useEssentialHealth();
  const [showDetails, setShowDetails] = useState(false);
  const [hasShownIssue, setHasShownIssue] = useState(false);

  // Auto-hide after showing issue for a while
  useEffect(() => {
    if (!isHealthy && !hasShownIssue) {
      setHasShownIssue(true);
      const timer = setTimeout(() => {
        setShowDetails(false);
      }, 5000); // Auto-hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isHealthy, hasShownIssue]);

  // Don't show if everything is healthy and we only want to show issues
  if (showOnlyIssues && isHealthy) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getStatusColor = () => {
    if (isHealthy) return 'bg-green-500';
    if (!network) return 'bg-red-500';
    if (!localStorage) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getStatusMessage = () => {
    if (isHealthy) return 'All systems operational';
    if (!network) return 'No internet connection';
    if (!localStorage) return 'Storage not available';
    return 'Limited functionality';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Status dot */}
      <div 
        className={`w-3 h-3 rounded-full ${getStatusColor()} cursor-pointer transition-all duration-300 ${
          !isHealthy ? 'animate-pulse' : ''
        }`}
        onClick={() => setShowDetails(!showDetails)}
        title={getStatusMessage()}
      />
      
      {/* Detailed status popup */}
      {showDetails && (
        <div className="absolute top-6 right-0 bg-card border rounded-lg shadow-lg p-3 min-w-48 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>System Status</span>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Internet</span>
                <div className={`w-2 h-2 rounded-full ${network ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <div className={`w-2 h-2 rounded-full ${localStorage ? 'bg-green-500' : 'bg-orange-500'}`} />
              </div>
            </div>
            
            {!isHealthy && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                {getStatusMessage()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple status badge for including in other components
export function SystemStatusBadge() {
  const { isHealthy } = useEssentialHealth();

  if (isHealthy) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      Limited functionality
    </div>
  );
}
