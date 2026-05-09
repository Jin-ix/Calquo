import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useReliableAdminDashboard } from './AdminDashboardReliabilityFix';
import { 
  TrendingUp, 
  AlertCircle, 
  BarChart3, 
  Users, 
  ShieldCheck,
  Database,
  ArrowRight,
  Clock,
  ExternalLink,
  Target,
  Activity,
  MapPin,
  CreditCard
} from 'lucide-react';

import { RazorpayDiagnostic } from './RazorpayDiagnostic';

interface DashboardOffer {
  title: string;
  desc: string;
  urgency: string;
  link: string;
}

interface DashboardRecommendation {
  title: string;
  rationale: string;
  name: string;
  price: string;
  origin: string;
  imagePrompt: string;
  button: string;
}

interface AdminDashboardData {
  userRole: string;
  offers: DashboardOffer[];
  recommendations: DashboardRecommendation[];
}

interface AdminDashboardContentProps {
  onNavigate: (view: string) => void;
}

export function AdminDashboardContent({ onNavigate }: AdminDashboardContentProps) {
  // Use reliable dashboard hook instead of manual loading
  const { dashboardData, isLoading, usingFallback, jsonLoaded } = useReliableAdminDashboard();

  // Component now uses the reliable dashboard hook
  // No manual loading needed - handled by useReliableAdminDashboard

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard data is guaranteed to be available from the hook
  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Initializing admin dashboard...</p>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    if (urgency.toLowerCase().includes('critical') || urgency.toLowerCase().includes('action needed')) {
      return 'destructive';
    }
    if (urgency.toLowerCase().includes('review') || urgency.toLowerCase().includes('now')) {
      return 'default';
    }
    return 'secondary';
  };

  const getOfferIcon = (title: string) => {
    if (title.toLowerCase().includes('growth') || title.toLowerCase().includes('surge')) {
      return <TrendingUp className="h-5 w-5" />;
    }
    if (title.toLowerCase().includes('critical') || title.toLowerCase().includes('gst')) {
      return <AlertCircle className="h-5 w-5" />;
    }
    if (title.toLowerCase().includes('market') || title.toLowerCase().includes('demand')) {
      return <BarChart3 className="h-5 w-5" />;
    }
    return <Activity className="h-5 w-5" />;
  };

  const getRecommendationIcon = (name: string) => {
    if (name.toLowerCase().includes('analytics') || name.toLowerCase().includes('tracking')) {
      return <BarChart3 className="h-5 w-5" />;
    }
    if (name.toLowerCase().includes('gst') || name.toLowerCase().includes('compliance')) {
      return <ShieldCheck className="h-5 w-5" />;
    }
    if (name.toLowerCase().includes('supplier') || name.toLowerCase().includes('rating')) {
      return <Users className="h-5 w-5" />;
    }
    if (name.toLowerCase().includes('security') || name.toLowerCase().includes('monitoring')) {
      return <ShieldCheck className="h-5 w-5" />;
    }
    if (name.toLowerCase().includes('market') || name.toLowerCase().includes('expansion')) {
      return <Target className="h-5 w-5" />;
    }
    return <Database className="h-5 w-5" />;
  };

  return (
    <div className="space-y-8">
      {/* Status Indicator */}
      {usingFallback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Dashboard operating with reliable embedded data</span>
            {!jsonLoaded && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                Fallback Mode
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {jsonLoaded && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Dashboard loaded with latest JSON content</span>
            <Badge variant="default" className="text-xs bg-green-100 text-green-700">
              Live Data
            </Badge>
          </div>
        </div>
      )}

      {/* Tailored Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Platform Insights & Alerts
          </h2>
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            {dashboardData.offers.length} active alerts
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.offers.map((offer, index) => (
            <Card key={index} className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 border-0 overflow-hidden relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getOfferIcon(offer.title)}
                  </div>
                  <Badge variant={getUrgencyColor(offer.urgency)} className="text-xs">
                    {offer.urgency}
                  </Badge>
                </div>
                <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors">
                  {offer.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs line-clamp-2 mb-3">
                  {offer.desc}
                </CardDescription>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-xs"
                  onClick={() => onNavigate('admin-dashboard')}
                >
                  {offer.link}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Strategic Recommendations
          </h2>
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            {dashboardData.recommendations.length} recommendations
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.recommendations.map((rec, index) => (
            <Card key={index} className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50 border-0 overflow-hidden relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    {getRecommendationIcon(rec.name)}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    Admin Tools
                  </Badge>
                </div>
                <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors">
                  {rec.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <CardDescription className="text-xs line-clamp-2">
                  {rec.rationale}
                </CardDescription>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{rec.price}</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{rec.origin}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => onNavigate('admin-dashboard')}
                >
                  {rec.button}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Gateway Diagnostic */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Payment Gateway
        </h2>
        <RazorpayDiagnostic />
      </div>

      {/* Quick Action Center */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1"
            onClick={() => onNavigate('admin-dashboard')}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">User Management</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1"
            onClick={() => onNavigate('admin-orders')}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Order Analytics</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1"
            onClick={() => onNavigate('system-monitoring')}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs">System Health</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1"
            onClick={() => onNavigate('security-alerts')}
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs">Security</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
