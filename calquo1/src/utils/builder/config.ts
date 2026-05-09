/**
 * Builder.io Configuration for CALICO
 * Visual page builder integration with role-based content
 */

// Safely access environment variable
const getBuilderApiKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_BUILDER_API_KEY || '';
    }
    return '';
  } catch (error) {
    return '';
  }
};

// Builder.io API Key - will be set via environment variable
export const BUILDER_API_KEY = getBuilderApiKey();

// Builder.io model names for different content types
export const BUILDER_MODELS = {
  PAGE: 'page',
  SECTION: 'section',
  HEADER: 'header',
  FOOTER: 'footer',
  BANNER: 'banner',
  PRODUCT_TEMPLATE: 'product-template',
  DASHBOARD_WIDGET: 'dashboard-widget',
} as const;

// Role-based content targeting
export const BUILDER_ROLES = {
  RETAILER: 'retailer',
  MANUFACTURER: 'manufacturer',
  TRADER: 'trader',
  LOGISTICS_AGENT: 'logistics-agent',
  FINANCIAL_AGENT: 'financial-agent',
  ADMIN: 'admin',
} as const;

// Language codes for multi-language support
export const BUILDER_LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
  TAMIL: 'ta',
  TELUGU: 'te',
  KANNADA: 'kn',
  MALAYALAM: 'ml',
  MARATHI: 'mr',
  GUJARATI: 'gu',
  BENGALI: 'bn',
} as const;

// Builder.io configuration options
export const BUILDER_CONFIG = {
  apiKey: BUILDER_API_KEY,
  canTrack: false, // Privacy-focused - no tracking for Phase 1
  customInsertMenu: true,
  includeRefs: true,
  prerender: false,
} as const;

// Check if Builder.io is configured
export const isBuilderConfigured = (): boolean => {
  if (!BUILDER_API_KEY) {
    // Silent check - no console warnings in production
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Builder.io API key not configured');
      }
    } catch (error) {
      // Silently handle any errors
    }
    return false;
  }
  return true;
};

// Get content options based on user context
export const getBuilderOptions = (role?: string, language?: string) => {
  const options: Record<string, any> = {
    ...BUILDER_CONFIG,
  };

  // Add targeting based on role
  if (role) {
    options.userAttributes = {
      role: role.toLowerCase(),
    };
  }

  // Add language locale
  if (language) {
    options.locale = language;
  }

  return options;
};
