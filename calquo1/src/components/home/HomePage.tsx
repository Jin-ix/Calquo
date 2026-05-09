import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { safeAddEventListener } from '../utils/timeout-protection';

import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { AdminDashboardContent } from '../admin/AdminDashboardContent';

// Import the role-specific dashboard components
import { RetailerDashboard } from '../dashboard/RetailerDashboard';
import { ManufacturerDashboard } from '../dashboard/ManufacturerDashboard';
import { TraderDashboard } from '../dashboard/TraderDashboard';
import { FinancialAgentDashboard } from '../dashboard/FinancialAgentDashboard';
import { LogisticsAgentDashboard } from '../dashboard/LogisticsAgentDashboard';

import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  UserPlus,
  Heart,
  Truck,
  Building2,
  Coins,
  FileText,
  Search,
  Plus,
  Eye,
  TrendingUp,
  Shield,
  Database,
  Bell,
  Zap,
  Star,
  ArrowRight,
  Calendar,
  Phone,
  Warehouse,
  RotateCcw,
  DollarSign
} from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';

interface HomePageProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

// Mock data for dashboard stats - in real app this would come from API
const mockData = {
  manufacturer: {
    totalStock: 15420,
    activeOrders: 89,
    revenue: 245000,
    customers: 156
  },
  warehouse: {
    totalStock: 8950,
    activeOrders: 45,
    revenue: 180000,
    suppliers: 23
  },
  retailer: {
    totalOrders: 134,
    pendingOrders: 12,
    totalSpent: 89000,
    savedAmount: 15000
  },
  financial: {
    totalTransactions: 450,
    pendingPayments: 67000,
    completedPayments: 890000,
    clients: 89
  }
};

export function HomePage({ onNavigate, currentView }: HomePageProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Listen for banner navigation events
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      try {
        if (event && event.detail && onNavigate) {
          onNavigate(event.detail);
        }
      } catch (error) {
        console.warn('Navigation error:', error);
      }
    };

    const cleanup = safeAddEventListener(window, 'navigate', handleNavigate as EventListener);
    return cleanup;
  }, [onNavigate]);

  if (!user) return null;

  // Quick Action Cards for each role
  const getQuickActions = () => {
    switch (user?.role) {
      case 'manufacturer':
        return [
          {
            id: 'my-stock',
            title: 'My Stock',
            description: 'Manage Collection',
            icon: <Package className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'my-stock'
          },
          {
            id: 'add-stock',
            title: 'List Item',
            description: 'New Arrival',
            icon: <Plus className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'add-stock'
          },
          {
            id: 'orders',
            title: 'Orders',
            description: 'Fulfillment',
            icon: <FileText className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'orders'
          },
          {
            id: 'analytics',
            title: 'Analytics',
            description: 'Performance',
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-black text-white',
            action: 'analytics'
          }
        ];

      case 'trader':
      case 'warehouse':
        return [
          {
            id: 'browse-stock',
            title: 'Lookbook',
            description: 'Discover Pieces',
            icon: <Search className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'browse-stock'
          },
          {
            id: 'my-stock',
            title: 'My Stock',
            description: 'Curated Inventory',
            icon: <Package className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'my-stock'
          },
          {
            id: 'add-stock',
            title: 'List Item',
            description: 'New Arrival',
            icon: <Plus className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'add-stock'
          },
          {
            id: 'cart',
            title: 'Cart',
            description: 'Checkout',
            icon: <ShoppingCart className="h-5 w-5" />,
            color: 'text-white',
            bgGradient: 'bg-black',
            action: 'cart'
          }
        ];

      case 'retailer':
        return [
          {
            id: 'browse-stock',
            title: 'Lookbook',
            description: 'Discover Curations',
            icon: <Search className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'browse-stock'
          },
          {
            id: 'cart',
            title: 'Cart',
            description: 'Your Selection',
            icon: <ShoppingCart className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'cart'
          },
          {
            id: 'my-orders',
            title: 'Orders',
            description: 'Track Purchases',
            icon: <FileText className="h-5 w-5" />,
            color: 'text-zinc-900',
            bgGradient: 'bg-white',
            action: 'my-orders'
          },
          {
            id: 'suppliers',
            title: 'Brands',
            description: 'Exclusive Partners',
            icon: <Building2 className="h-5 w-5" />,
            color: 'text-white',
            bgGradient: 'bg-black',
            action: 'suppliers'
          }
        ];

      case 'financial_agent':
        return [
          {
            id: 'transactions',
            title: 'Transactions',
            description: 'Manage payments',
            icon: <CreditCard className="h-5 w-5" />,
            color: 'text-green-600',
            bgGradient: 'from-green-50 to-emerald-100',
            action: 'transactions'
          },
          {
            id: 'clients',
            title: 'Clients',
            description: 'Client accounts',
            icon: <Users className="h-5 w-5" />,
            color: 'text-blue-600',
            bgGradient: 'from-blue-50 to-indigo-100',
            action: 'clients'
          },
          {
            id: 'reports',
            title: 'Reports',
            description: 'Financial reports',
            icon: <FileText className="h-5 w-5" />,
            color: 'text-purple-600',
            bgGradient: 'from-purple-50 to-violet-100',
            action: 'reports'
          },
          {
            id: 'analytics',
            title: 'Analytics',
            description: 'View insights',
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'text-indigo-600',
            bgGradient: 'from-indigo-50 to-blue-100',
            action: 'analytics'
          }
        ];

      case 'logistics_agent':
        return [
          {
            id: 'shipments',
            title: 'Shipments',
            description: 'Manage deliveries',
            icon: <Truck className="h-5 w-5" />,
            color: 'text-blue-600',
            bgGradient: 'from-blue-50 to-indigo-100',
            action: 'shipments'
          },
          {
            id: 'routes',
            title: 'Routes',
            description: 'Delivery routes',
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'text-green-600',
            bgGradient: 'from-green-50 to-emerald-100',
            action: 'routes'
          },
          {
            id: 'tracking',
            title: 'Tracking',
            description: 'Track packages',
            icon: <Search className="h-5 w-5" />,
            color: 'text-orange-600',
            bgGradient: 'from-orange-50 to-amber-100',
            action: 'tracking'
          },
          {
            id: 'analytics',
            title: 'Analytics',
            description: 'View insights',
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'text-indigo-600',
            bgGradient: 'from-indigo-50 to-blue-100',
            action: 'analytics'
          }
        ];

      case 'admin':
        return [
          {
            id: 'users',
            title: 'User Management',
            description: 'Manage users',
            icon: <Users className="h-5 w-5" />,
            color: 'text-blue-600',
            bgGradient: 'from-blue-50 to-indigo-100',
            action: 'users'
          },
          {
            id: 'database',
            title: 'Database',
            description: 'Database setup',
            icon: <Database className="h-5 w-5" />,
            color: 'text-purple-600',
            bgGradient: 'from-purple-50 to-violet-100',
            action: 'database'
          },
          {
            id: 'suppliers',
            title: 'Suppliers',
            description: 'Manage suppliers',
            icon: <Building2 className="h-5 w-5" />,
            color: 'text-green-600',
            bgGradient: 'from-green-50 to-emerald-100',
            action: 'suppliers'
          },
          {
            id: 'settings',
            title: 'Settings',
            description: 'System settings',
            icon: <Settings className="h-5 w-5" />,
            color: 'text-orange-600',
            bgGradient: 'from-orange-50 to-amber-100',
            action: 'settings'
          }
        ];

      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  // Render role-specific dashboard content
  const renderDashboardContent = () => {
    console.log('[HomePage] Rendering dashboard for role:', user.role, 'Full user:', user);
    switch (user.role) {
      case 'manufacturer':
        return <ManufacturerDashboard />;
      case 'warehouse':
      case 'trader':
        return <TraderDashboard onNavigate={onNavigate} />;
      case 'retailer':
        return <RetailerDashboard />;
      case 'financial_agent':
      case 'financial':
        return <FinancialAgentDashboard onNavigate={onNavigate} />;
      case 'logistics_agent':
      case 'logistics-agent':
        return <LogisticsAgentDashboard view={currentView} onNavigate={onNavigate} />;
      case 'admin':
        return <AdminDashboardContent />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Dashboard not available for this role
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-6 md:p-8 space-y-8">
      {/* Header */}



      {/* Dashboard Content */}
      <div className="space-y-6 md:space-y-12 pb-12">
        {renderDashboardContent()}
      </div>

      {/* Recent Activity Section - Hide for admin users */}
      {user?.role !== 'admin' && (
        <div className="mb-12">
          <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB] mb-4">
            <h2 className="text-3xl font-black tracking-tighter uppercase font-heading text-black">
              Activity Feed
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate?.('analytics')} className="font-bold text-xs tracking-widest uppercase hover:bg-zinc-50 rounded-none px-6 border border-[#E5E5E5] text-black">
              All Logs
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
          <div className="space-y-0">
            {/* Mock recent activity items */}
            {[
              { icon: <Package className="h-5 w-5" />, text: 'New item listed: Premium Cotton T-Shirt', time: '2 HOURS AGO', color: 'bg-zinc-50 text-black border border-[#E5E5E5]' },
              { icon: <ShoppingCart className="h-5 w-5" />, text: 'Order received from Mumbai Fashions', time: '4 HOURS AGO', color: 'bg-zinc-50 text-black border border-[#E5E5E5]' },
              { icon: <Users className="h-5 w-5" />, text: 'Brand added to VIP preferred list', time: '1 DAY AGO', color: 'bg-zinc-50 text-black border border-[#E5E5E5]' },
              { icon: <CreditCard className="h-5 w-5" />, text: 'Payment invoice cleared successfully', time: '2 DAYS AGO', color: 'bg-black text-white' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-6 group py-4 border-b border-[#E5E7EB] transition-all cursor-pointer hover:bg-zinc-50/50 hover:pl-2">
                <div className={`p-4 rounded-full ${activity.color} shrink-0 transition-all duration-500 group-hover:scale-[1.15] group-hover:shadow-lg`}>
                  {activity.icon}
                </div>
                <div className="flex-1 space-y-1.5 transition-transform duration-300 group-hover:translate-x-2">
                  <p className="text-base font-bold text-zinc-900 tracking-tight">{activity.text}</p>
                  <p className="text-[10px] font-black tracking-[0.2em] text-[#A3A3A3] uppercase">{activity.time}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-black group-hover:translate-x-3 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Luxury Contact/Support Block */}
      <Card className="bg-white text-black border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden relative group transition-all duration-500 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-in-out pointer-events-none" />
        <CardContent className="p-8 md:p-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6 md:gap-8">
              <div className="p-5 rounded-full bg-black/5 text-black border border-black/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                <Phone className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-3xl md:text-4xl tracking-tighter font-heading text-black group-hover:tracking-tight transition-all duration-500">Concierge.</h3>
                <p className="text-sm md:text-base text-zinc-500 font-medium group-hover:text-zinc-700 transition-colors">Bespoke support for your brand, 24/7.</p>
              </div>
            </div>
            <MagneticButton className="w-full sm:w-auto">
              <Button variant="default" className="shadow-none border border-transparent hover:border-[#E5E5E5] h-16 w-full sm:w-auto px-10 rounded-none bg-black text-white hover:bg-zinc-800 transition-all duration-300 font-black tracking-widest uppercase text-sm flex items-center justify-center group-hover:scale-[0.98]">
                Contact Us
                <ArrowRight className="h-4 w-4 ml-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </Button>
            </MagneticButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
