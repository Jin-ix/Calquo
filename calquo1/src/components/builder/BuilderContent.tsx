/**
 * Builder.io Content Renderer for CALICO
 * Renders visual content from Builder.io with silent error handling
 */

import React, { useState, useEffect } from 'react';
import { BuilderComponent, builder } from '@builder.io/react';
import { BUILDER_API_KEY, isBuilderConfigured } from '../../utils/builder/config';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';

// Initialize Builder
if (BUILDER_API_KEY) {
  builder.init(BUILDER_API_KEY);
}

interface BuilderContentProps {
  /** Builder.io model name (e.g., 'page', 'section') */
  model: string;
  /** Content entry URL or path */
  content?: string;
  /** Builder.io entry ID (alternative to content) */
  entryId?: string;
  /** Custom data to pass to Builder content */
  data?: Record<string, any>;
  /** Fallback content when Builder content is not available */
  fallback?: React.ReactNode;
  /** Custom options for Builder */
  options?: Record<string, any>;
  /** Custom class name */
  className?: string;
}

export function BuilderContent({
  model,
  content,
  entryId,
  data = {},
  fallback = null,
  options = {},
  className = '',
}: BuilderContentProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [builderContent, setBuilderContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if Builder is configured
    if (!isBuilderConfigured()) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let isMounted = true;

    const fetchContent = async () => {
      try {
        setIsLoading(true);

        // Build query options
        const queryOptions: Record<string, any> = {
          userAttributes: {
            role: user?.role?.toLowerCase() || 'guest',
            userId: user?.id || '',
            ...options.userAttributes,
          },
          locale: language || 'en',
          ...options,
        };

        // Fetch content by URL or entry ID
        let fetchedContent;
        if (entryId) {
          fetchedContent = await builder
            .get(model, {
              query: {
                id: entryId,
              },
              ...queryOptions,
            })
            .promise();
        } else {
          fetchedContent = await builder
            .get(model, {
              url: content || window.location.pathname,
              ...queryOptions,
            })
            .promise();
        }

        if (isMounted) {
          setBuilderContent(fetchedContent);
          setHasError(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          // Silent error - only log in dev mode
          try {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
              console.warn('Builder.io content fetch error:', error);
            }
          } catch (e) {
            // Silently handle console error
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [model, content, entryId, user?.role, user?.id, language, options]);

  // Silent loading state - minimal spinner
  if (isLoading && !builderContent) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary opacity-30"></div>
      </div>
    );
  }

  // Silent error state - show fallback
  if (hasError || !builderContent) {
    return fallback ? <>{fallback}</> : null;
  }

  // Render Builder content
  return (
    <div className={className}>
      <BuilderComponent
        model={model}
        content={builderContent}
        data={{
          user,
          language,
          ...data,
        }}
      />
    </div>
  );
}

/**
 * Hook to fetch Builder content programmatically
 */
export function useBuilderContent(model: string, urlPath?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isBuilderConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const fetchedContent = await builder
          .get(model, {
            url: urlPath || window.location.pathname,
            userAttributes: {
              role: user?.role?.toLowerCase() || 'guest',
              userId: user?.id || '',
            },
            locale: language || 'en',
          })
          .promise();

        if (isMounted) {
          setContent(fetchedContent);
        }
      } catch (error) {
        // Silent error - only log in dev mode
        try {
          if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
            console.warn('Builder.io content fetch error:', error);
          }
        } catch (e) {
          // Silently handle console error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [model, urlPath, user?.role, user?.id, language]);

  return { content, isLoading };
}
