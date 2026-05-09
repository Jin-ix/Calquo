/**
 * Builder.io Page Component for CALICO
 * Full-page visual content with fallback to existing pages
 */

import React from 'react';
import { BuilderContent } from './BuilderContent';
import { BUILDER_MODELS } from '../../utils/builder/config';

interface BuilderPageProps {
  /** Page URL path */
  path?: string;
  /** Fallback component when Builder content is not available */
  fallback?: React.ReactNode;
  /** Custom data to pass to Builder */
  data?: Record<string, any>;
  /** Custom class name */
  className?: string;
}

export function BuilderPage({ 
  path, 
  fallback, 
  data = {},
  className = 'min-h-screen'
}: BuilderPageProps) {
  return (
    <BuilderContent
      model={BUILDER_MODELS.PAGE}
      content={path || window.location.pathname}
      fallback={fallback}
      data={data}
      className={className}
    />
  );
}

/**
 * Builder Section Component
 * For embedding Builder sections within existing pages
 */
interface BuilderSectionProps {
  /** Section entry ID */
  sectionId: string;
  /** Fallback component */
  fallback?: React.ReactNode;
  /** Custom data */
  data?: Record<string, any>;
  /** Custom class name */
  className?: string;
}

export function BuilderSection({
  sectionId,
  fallback = null,
  data = {},
  className = '',
}: BuilderSectionProps) {
  return (
    <BuilderContent
      model={BUILDER_MODELS.SECTION}
      entryId={sectionId}
      fallback={fallback}
      data={data}
      className={className}
    />
  );
}

/**
 * Builder Banner Component
 * For dynamic banners and announcements
 */
interface BuilderBannerProps {
  /** Banner entry ID or path */
  bannerId?: string;
  /** Fallback component */
  fallback?: React.ReactNode;
  /** Custom data */
  data?: Record<string, any>;
  /** Custom class name */
  className?: string;
}

export function BuilderBanner({
  bannerId,
  fallback = null,
  data = {},
  className = '',
}: BuilderBannerProps) {
  return (
    <BuilderContent
      model={BUILDER_MODELS.BANNER}
      entryId={bannerId}
      fallback={fallback}
      data={data}
      className={className}
    />
  );
}

/**
 * Builder Dashboard Widget
 * For visual dashboard components
 */
interface BuilderDashboardWidgetProps {
  /** Widget entry ID */
  widgetId: string;
  /** Fallback component */
  fallback?: React.ReactNode;
  /** Custom data */
  data?: Record<string, any>;
  /** Custom class name */
  className?: string;
}

export function BuilderDashboardWidget({
  widgetId,
  fallback = null,
  data = {},
  className = '',
}: BuilderDashboardWidgetProps) {
  return (
    <BuilderContent
      model={BUILDER_MODELS.DASHBOARD_WIDGET}
      entryId={widgetId}
      fallback={fallback}
      data={data}
      className={className}
    />
  );
}
