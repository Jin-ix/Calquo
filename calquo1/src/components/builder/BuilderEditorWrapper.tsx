/**
 * Builder.io Editor Wrapper for CALICO
 * Provides the Builder visual editor in development/preview mode
 */

import React from 'react';
import { BuilderComponent, builder } from '@builder.io/react';
import { BUILDER_API_KEY } from '../../utils/builder/config';

// Initialize Builder
if (BUILDER_API_KEY) {
  builder.init(BUILDER_API_KEY);
}

/**
 * Builder Editor Component
 * Only renders in Builder.io preview mode
 */
export function BuilderEditor() {
  const isPreviewMode = 
    typeof window !== 'undefined' && 
    (window.location.search.includes('builder.preview=') ||
     window.location.search.includes('builder.space='));

  if (!isPreviewMode || !BUILDER_API_KEY) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <BuilderComponent 
        model="page" 
        content={undefined}
      />
    </div>
  );
}

/**
 * Check if currently in Builder.io editing mode
 */
export function useBuilderEditing(): boolean {
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const editing = 
        window.location.search.includes('builder.preview=') ||
        window.location.search.includes('builder.space=') ||
        window.location.search.includes('builder.editing=');
      
      setIsEditing(editing);
    }
  }, []);

  return isEditing;
}

/**
 * Builder Preview Frame
 * Wraps content in Builder preview mode with proper context
 */
interface BuilderPreviewFrameProps {
  children: React.ReactNode;
}

export function BuilderPreviewFrame({ children }: BuilderPreviewFrameProps) {
  const isEditing = useBuilderEditing();

  if (!isEditing) {
    return <>{children}</>;
  }

  return (
    <div className="builder-preview-frame">
      {/* Add preview-specific styles or overlays here */}
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-50">
        Builder.io Preview Mode
      </div>
      <div className="pt-10">
        {children}
      </div>
    </div>
  );
}
