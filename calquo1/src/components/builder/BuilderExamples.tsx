/**
 * Builder.io Usage Examples for CALICO
 * Demonstrates how to integrate Builder content into existing pages
 */

import React from 'react';
import { BuilderPage, BuilderSection, BuilderBanner, BuilderDashboardWidget } from './BuilderPage';
import { useBuilder } from './BuilderProvider';
import { Badge } from '../ui/badge';

/**
 * Example 1: Full Page with Builder.io
 * This page can be completely customized in Builder.io visual editor
 */
export function PromotionsPage() {
  return (
    <BuilderPage
      path="/promotions"
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Current Promotions</h1>
          <p className="text-gray-600">No special promotions at this time.</p>
        </div>
      }
    />
  );
}

/**
 * Example 2: Existing Page with Builder Section
 * Embed Builder content within your existing page
 */
export function DashboardWithBuilderBanner() {
  const { isConfigured } = useBuilder();

  return (
    <div>
      {/* Builder.io dynamic banner (optional) */}
      {isConfigured && (
        <BuilderBanner 
          bannerId="dashboard-announcement"
          fallback={null}
        />
      )}

      {/* Your existing dashboard content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* Rest of your dashboard... */}
      </div>
    </div>
  );
}

/**
 * Example 3: Role-Based Landing Pages
 * Different Builder content based on user role
 */
export function RoleBasedHomePage({ role }: { role: string }) {
  return (
    <BuilderPage
      path={`/home/${role.toLowerCase()}`}
      fallback={
        <div className="p-8">
          <h1>Welcome, {role}!</h1>
          <p>Your personalized dashboard is loading...</p>
        </div>
      }
    />
  );
}

/**
 * Example 4: Festival Campaign Page
 * Special pages for festivals that can be edited visually
 */
export function FestivalCampaignPage({ festivalName }: { festivalName: string }) {
  return (
    <BuilderPage
      path={`/campaigns/${festivalName.toLowerCase()}`}
      data={{ festivalName }}
      fallback={
        <div className="p-8 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg">
          <h1 className="text-3xl font-bold mb-4">🪔 {festivalName} Special</h1>
          <p className="text-lg">Check back soon for special offers!</p>
        </div>
      }
    />
  );
}

/**
 * Example 5: Help Center with Builder
 * Create visual help documentation
 */
export function HelpCenter() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <Badge variant="outline" className="text-xs">
          Visual Content Enabled
        </Badge>
      </div>

      {/* Builder section for help articles */}
      <BuilderSection
        sectionId="help-articles"
        fallback={
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Getting Started</h3>
              <p className="text-sm text-gray-600">Learn the basics</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Stock Management</h3>
              <p className="text-sm text-gray-600">Manage your inventory</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Orders</h3>
              <p className="text-sm text-gray-600">Track and fulfill orders</p>
            </div>
          </div>
        }
      />
    </div>
  );
}

/**
 * Example 6: Enhanced Dashboard with Builder Widgets
 * Add custom widgets to existing dashboards
 */
export function EnhancedDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Static widgets */}
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-green-600">₹45,234</p>
        </div>

        {/* Builder.io dynamic widget */}
        <BuilderDashboardWidget
          widgetId="promo-widget"
          fallback={null}
        />

        {/* More static widgets */}
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 7: Multi-Language Content
 * Builder content will automatically use user's language preference
 */
export function MultiLanguageAboutPage() {
  return (
    <BuilderPage
      path="/about"
      fallback={
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">About CALICO</h1>
          <p className="text-lg mb-4">
            CALICO - Weaving India Together!
          </p>
          <p className="text-gray-600">
            We connect retailers, manufacturers, traders, and financial agents
            in the Indian textile industry.
          </p>
        </div>
      }
    />
  );
}

/**
 * Example 8: Announcement Banner
 * Show system-wide announcements
 */
export function GlobalAnnouncementBanner() {
  return (
    <BuilderBanner
      bannerId="global-announcement"
      fallback={null}
      className="sticky top-0 z-40"
    />
  );
}

/**
 * Example 9: Product Landing Page Template
 * Custom product showcase pages
 */
export function ProductCategoryLanding({ category }: { category: string }) {
  return (
    <BuilderPage
      path={`/category/${category}`}
      data={{ category }}
      fallback={
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{category}</h1>
          <p className="text-gray-600">Browse our {category} collection</p>
        </div>
      }
    />
  );
}

/**
 * Example 10: Terms & Conditions (Legal Pages)
 * Easy-to-update legal pages
 */
export function TermsAndConditions() {
  return (
    <BuilderPage
      path="/terms"
      fallback={
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-gray-600">
            Please read these terms carefully before using CALICO.
          </p>
        </div>
      }
    />
  );
}
