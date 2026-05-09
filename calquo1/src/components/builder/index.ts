/**
 * Builder.io Integration Index
 * Export all Builder.io components and utilities
 */

// Main components
export { BuilderContent, useBuilderContent } from './BuilderContent';
export { 
  BuilderPage, 
  BuilderSection, 
  BuilderBanner, 
  BuilderDashboardWidget 
} from './BuilderPage';

// Provider and hooks
export { BuilderProvider, useBuilder, withBuilderFallback } from './BuilderProvider';

// Editor components
export { 
  BuilderEditor, 
  useBuilderEditing, 
  BuilderPreviewFrame 
} from './BuilderEditorWrapper';

// Custom components registration
export { registerBuilderComponents } from './CustomComponents';

// Configuration
export { 
  BUILDER_API_KEY,
  BUILDER_MODELS,
  BUILDER_ROLES,
  BUILDER_LANGUAGES,
  BUILDER_CONFIG,
  isBuilderConfigured,
  getBuilderOptions
} from '../../utils/builder/config';
