import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Badge } from '../ui/badge';
import {
  BarChart3,
  Package,
  Plus,
  ShoppingCart,
  Warehouse,
  Building2,
  Users,
  CreditCard,
  FileText,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Truck,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { useOrders } from '../context/OrderProvider';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  badge?: string;
  description: string;
}

interface TopNavigationProps {
  onNavigate: (view: string) => void;
  currentView?: string;
}

export function TopNavigation({ onNavigate, currentView }: TopNavigationProps) {
  const { user } = useAuth();
  const { incomingOrderCount } = useOrders();

  // Navigation items based on user role - matching Sidebar exactly
  const getNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [];

    // Badge for Orders
    const ordersBadge = incomingOrderCount > 0 ? incomingOrderCount.toString() : undefined;

    switch ((user?.role as any)) {
      case 'manufacturer':
        items.push(
          {
            id: 'my-stock',
            label: 'My Stock',
            icon: <Package className="h-4 w-4" />,
            action: 'my-stock',
            badge: 'Inventory',
            description: 'Manage your inventory'
          },
          {
            id: 'add-stock',
            label: 'Add New Stock',
            icon: <Plus className="h-4 w-4" />,
            action: 'add-stock',
            badge: 'New',
            description: 'Add new products'
          },
          {
            id: 'orders',
            label: 'Orders',
            icon: <ShoppingCart className="h-4 w-4" />,
            action: 'orders',
            badge: ordersBadge,
            description: 'Manage incoming orders'
          },
          {
            id: 'payments',
            label: 'Payments',
            icon: <CreditCard className="h-4 w-4" />,
            action: 'payments',
            badge: 'Finance',
            description: 'Payment management'
          },
          {
            id: 'dashboard',
            label: 'Analytics Dashboard',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'dashboard',
            badge: 'Insights',
            description: 'View business metrics'
          }
        );
        break;

      case 'warehouse':
      case 'trader':
        items.push(
          {
            id: 'browse-stock',
            label: 'Browse Stock',
            icon: <Package className="h-4 w-4" />,
            action: 'browse-stock',
            badge: 'Catalog',
            description: 'Browse available products'
          },
          {
            id: 'my-stock',
            label: 'My Stock',
            icon: <Warehouse className="h-4 w-4" />,
            action: 'my-stock',
            badge: 'Inventory',
            description: 'Manage trading stock'
          },
          {
            id: 'add-stock',
            label: 'Add Stock',
            icon: <Plus className="h-4 w-4" />,
            action: 'add-stock',
            badge: 'New',
            description: 'Add new products'
          },
          {
            id: 'orders',
            label: 'Orders',
            icon: <ShoppingCart className="h-4 w-4" />,
            action: 'orders',
            badge: ordersBadge,
            description: 'Manage incoming orders'
          },
          {
            id: 'suppliers',
            label: 'Suppliers Directory',
            icon: <Building2 className="h-4 w-4" />,
            action: 'suppliers',
            badge: 'Directory',
            description: 'Manage suppliers'
          },
          {
            id: 'clients',
            label: 'Clients',
            icon: <Users className="h-4 w-4" />,
            action: 'clients',
            badge: 'Clients',
            description: 'Manage your clients'
          },
          {
            id: 'purchase-return',
            label: 'Purchase Returns',
            icon: <RotateCcw className="h-4 w-4" />,
            action: 'purchase-return',
            badge: 'Returns',
            description: 'Submit and track returns'
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'analytics',
            badge: 'Insights',
            description: 'Advanced analytics and metrics'
          }
        );
        break;

      case 'retailer':
        items.push(
          {
            id: 'browse-stock',
            label: 'Browse Stock',
            icon: <Package className="h-4 w-4" />,
            action: 'browse-stock',
            badge: 'Catalog',
            description: 'Browse available products'
          },
          {
            id: 'my-orders',
            label: 'My Orders',
            icon: <ShoppingCart className="h-4 w-4" />,
            action: 'my-orders',
            badge: 'Orders',
            description: 'Track your orders'
          },
          {
            id: 'suppliers',
            label: 'Suppliers Directory',
            icon: <Users className="h-4 w-4" />,
            action: 'suppliers',
            badge: 'Directory',
            description: 'Browse suppliers'
          },
          {
            id: 'payments',
            label: 'Payments',
            icon: <CreditCard className="h-4 w-4" />,
            action: 'payments',
            badge: 'Finance',
            description: 'Process payments'
          },
          {
            id: 'purchase-return',
            label: 'Purchase Return',
            icon: <RotateCcw className="h-4 w-4" />,
            action: 'purchase-return',
            badge: 'Returns',
            description: 'Submit and track returns'
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'analytics',
            badge: 'Insights',
            description: 'Advanced analytics and metrics'
          }
        );
        break;

      case 'financial':
        items.push(
          {
            id: 'agent-dashboard',
            label: 'Payment Approvals',
            icon: <CreditCard className="h-4 w-4" />,
            action: 'agent-dashboard',
            badge: 'Approvals',
            description: 'Manage payment approvals'
          },
          {
            id: 'transactions',
            label: 'Transactions',
            icon: <CreditCard className="h-4 w-4" />,
            action: 'transactions',
            badge: 'Finance',
            description: 'View transactions'
          },
          {
            id: 'pending-payments',
            label: 'Pending Payments',
            icon: <FileText className="h-4 w-4" />,
            action: 'pending-payments',
            badge: 'Pending',
            description: 'Review pending payments'
          },
          {
            id: 'reports',
            label: 'Reports',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'reports',
            badge: 'Reports',
            description: 'Financial reports'
          },
          {
            id: 'clients',
            label: 'Clients',
            icon: <Users className="h-4 w-4" />,
            action: 'clients',
            badge: 'Clients',
            description: 'Manage clients'
          }
        );
        break;

      case 'logistics-agent':
        items.push(
          {
            id: 'logistics-dashboard',
            label: 'Logistics Dashboard',
            icon: <Truck className="h-4 w-4" />,
            action: 'logistics-dashboard',
            badge: 'Dashboard',
            description: 'Logistics overview'
          },
          {
            id: 'shipment-tracking',
            label: 'Shipment Tracking',
            icon: <Package className="h-4 w-4" />,
            action: 'shipment-tracking',
            badge: 'Tracking',
            description: 'Track shipments'
          },
          {
            id: 'pickup-schedule',
            label: 'Pickup Schedule',
            icon: <Calendar className="h-4 w-4" />,
            action: 'pickup-schedule',
            badge: 'Schedule',
            description: 'Manage pickup schedule'
          },
          {
            id: 'delivery-routes',
            label: 'Delivery Routes',
            icon: <Activity className="h-4 w-4" />,
            action: 'delivery-routes',
            badge: 'Routes',
            description: 'Optimize delivery routes'
          },
          {
            id: 'logistics-reports',
            label: 'Logistics Reports',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'logistics-reports',
            badge: 'Reports',
            description: 'View logistics reports'
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="h-4 w-4" />,
            action: 'analytics',
            badge: 'Analytics',
            description: 'Advanced analytics and metrics'
          }
        );
        break;

      case 'admin':
        items.push(
          {
            id: 'admin-dashboard',
            label: 'Admin Dashboard',
            icon: <Shield className="h-4 w-4" />,
            action: 'admin-dashboard',
            badge: 'Admin',
            description: 'Administrative overview'
          },
          {
            id: 'admin-orders',
            label: 'Order Management',
            icon: <ShoppingCart className="h-4 w-4" />,
            action: 'admin-orders',
            badge: ordersBadge,
            description: 'Manage all orders'
          },
          {
            id: 'user-management',
            label: 'User Management',
            icon: <Users className="h-4 w-4" />,
            action: 'user-management',
            badge: 'Users',
            description: 'Manage users'
          },
          {
            id: 'system-monitoring',
            label: 'System Monitoring',
            icon: <Activity className="h-4 w-4" />,
            action: 'system-monitoring',
            badge: 'System',
            description: 'Monitor system health'
          },
          {
            id: 'financial-overview',
            label: 'Financial Overview',
            icon: <CreditCard className="h-4 w-4" />,
            action: 'financial-overview',
            badge: 'Finance',
            description: 'Financial insights'
          },
          {
            id: 'data-management',
            label: 'Data Management',
            icon: <Database className="h-4 w-4" />,
            action: 'data-management',
            badge: 'Data',
            description: 'Manage data'
          },
          {
            id: 'security-alerts',
            label: 'Security Alerts',
            icon: <AlertTriangle className="h-4 w-4" />,
            action: 'security-alerts',
            badge: 'Security',
            description: 'Security monitoring'
          },
          {
            id: 'system-settings',
            label: 'System Settings',
            icon: <Settings className="h-4 w-4" />,
            action: 'system-settings',
            badge: 'Settings',
            description: 'System configuration'
          }
        );
        break;

      default:
        return [];
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (action: string) => {
    onNavigate(action);
  };

  return (
    <div className="border-b glass-panel sticky top-12 sm:top-14 z-40 transition-all duration-300">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center justify-center py-2 sm:py-3">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 flex-wrap gap-y-1 sm:gap-y-2 max-w-7xl">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.action ? "default" : "ghost"}
                onClick={() => handleNavigation(item.action)}
                className={`h-10 px-3 flex-shrink-0 ${currentView === item.action
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-primary/10"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/20 text-primary border-0 ml-1"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Tablet Navigation */}
        <div className="hidden lg:flex xl:hidden items-center justify-center py-2">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin w-full max-w-6xl px-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.action ? "default" : "ghost"}
                onClick={() => handleNavigation(item.action)}
                className={`h-10 px-2 whitespace-nowrap flex-shrink-0 ${currentView === item.action
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-primary/10"
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Medium Tablet Navigation - Icons Only */}
        <div className="hidden md:flex lg:hidden items-center justify-center py-2">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin max-w-4xl px-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.action ? "default" : "ghost"}
                onClick={() => handleNavigation(item.action)}
                size="sm"
                className={`h-10 w-10 p-0 flex-shrink-0 ${currentView === item.action
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-primary/10"
                  }`}
                title={item.label}
              >
                {item.icon}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation - Scrollable Icons */}
        <div className="flex md:hidden items-center py-2 relative">
          {/* Gradient fade indicators for scroll */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />

          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-thin w-full px-2 pb-1 snap-x snap-proximity">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.action ? "default" : "ghost"}
                onClick={() => handleNavigation(item.action)}
                size="sm"
                className={`h-10 w-10 p-0 flex-shrink-0 relative snap-center transition-all duration-200 ${currentView === item.action
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "hover:bg-primary/10 hover:scale-105"
                  }`}
                title={item.label}
              >
                {item.icon}
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-red-500 text-white border-0 shadow-sm animate-pulse"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
