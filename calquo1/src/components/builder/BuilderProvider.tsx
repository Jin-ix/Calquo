/**
 * Builder.io Provider for CALICO
 * Initializes Builder.io and provides context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { builder } from '@builder.io/react';
import { BUILDER_API_KEY, isBuilderConfigured } from '../../utils/builder/config';
import { registerBuilderComponents } from './CustomComponents';

interface BuilderContextValue {
  isConfigured: boolean;
  isReady: boolean;
}

const BuilderContext = createContext<BuilderContextValue>({
  isConfigured: false,
  isReady: false,
});

export const useBuilder = () => useContext(BuilderContext);

interface BuilderProviderProps {
  children: React.ReactNode;
}

export function BuilderProvider({ children }: BuilderProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const configured = isBuilderConfigured();

  useEffect(() => {
    if (!configured) {
      setIsReady(true);
      return;
    }

    try {
      // Initialize Builder
      builder.init(BUILDER_API_KEY);

      // Register custom components
      registerBuilderComponents();

      // Configure Builder settings
      builder.canTrack = false; // Privacy-focused for Phase 1

      setIsReady(true);

      // Silent log in dev mode only
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.log('Builder.io initialized successfully');
        }
      } catch (e) {
        // Silently handle console error
      }
    } catch (error) {
      // Silent error handling
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.warn('Builder.io initialization error:', error);
        }
      } catch (e) {
        // Silently handle console error
      }
      setIsReady(true); // Continue without Builder
    }
  }, [configured]);

  return (
    <BuilderContext.Provider value={{ isConfigured: configured, isReady }}>
      {children}
    </BuilderContext.Provider>
  );
}

/**
 * HOC to wrap components with Builder.io fallback
 */
export function withBuilderFallback<P extends object>(
  Component: React.ComponentType<P>,
  builderModel: string,
  builderPath?: string
) {
  return function BuilderWrappedComponent(props: P) {
    const { isConfigured, isReady } = useBuilder();

    // If Builder is not configured or not ready, show original component
    if (!isConfigured || !isReady) {
      return <Component {...props} />;
    }

    // Try to load Builder content, fallback to original component
    return (
      <BuilderContent
        model={builderModel}
        content={builderPath}
        fallback={<Component {...props} />}
        data={props}
      />
    );
  };
}

// Import BuilderContent here to avoid circular dependency
import { BuilderContent } from './BuilderContent';
