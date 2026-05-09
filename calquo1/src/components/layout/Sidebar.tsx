import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { cn } from '../ui/utils';
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
  Home
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [mouseX, setMouseX] = useState(0);

  // Track mouse position for hover detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      
      // Show sidebar when mouse is within 50px of left edge
      if (e.clientX <= 50) {
        setIsVisible(true);
      } else if (e.clientX > 280) {
        // Hide sidebar when mouse moves away (280px = sidebar width + buffer)
        setIsVisible(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { id: 'home', label: t('nav.home') || 'Home', icon: Home },
      { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3 }
    ];

    switch (user?.role) {
      case 'manufacturer':
        return [
          ...baseItems,
          { id: 'my-stock', label: t('nav.mystock'), icon: Package },
          { id: 'add-stock', label: t('nav.addstock'), icon: Plus },
          { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      
      case 'warehouse':
        return [
          ...baseItems,
          { id: 'my-stock', label: 'Trading Stock', icon: Warehouse },
          { id: 'add-stock', label: t('nav.addstock'), icon: Plus },
          { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
          { id: 'suppliers', label: 'Suppliers', icon: Building2 }
        ];
      
      case 'trader':
        return [
          ...baseItems,
          { id: 'browse-stock', label: t('nav.browsestock'), icon: Package },
          { id: 'my-orders', label: 'My Orders', icon: ShoppingCart },
          { id: 'suppliers', label: 'Suppliers Directory', icon: Building2 },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      
      case 'retailer':
        return [
          ...baseItems,
          { id: 'browse-stock', label: t('nav.browsestock'), icon: Package },
          { id: 'my-orders', label: 'My Orders', icon: ShoppingCart },
          { id: 'suppliers', label: 'Suppliers Directory', icon: Users },
          { id: 'payments', label: t('nav.payments'), icon: CreditCard }
        ];
      
      case 'financial':
        return [
          ...baseItems,
          { id: 'agent-dashboard', label: 'Payment Approvals', icon: CreditCard },
          { id: 'transactions', label: 'Transactions', icon: CreditCard },
          { id: 'pending-payments', label: 'Pending Payments', icon: FileText },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'clients', label: 'Clients', icon: Users }
        ];
      
      case 'logistics-agent':
        return [
          ...baseItems,
          { id: 'logistics-dashboard', label: 'Logistics Dashboard', icon: Warehouse },
          { id: 'shipment-tracking', label: 'Shipment Tracking', icon: Package },
          { id: 'pickup-schedule', label: 'Pickup Schedule', icon: ShoppingCart },
          { id: 'delivery-routes', label: 'Delivery Routes', icon: Activity },
          { id: 'logistics-reports', label: 'Logistics Reports', icon: BarChart3 }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { id: 'admin-dashboard', label: 'Admin Dashboard', icon: Shield },
          { id: 'admin-orders', label: 'Order Management', icon: ShoppingCart },
          { id: 'user-management', label: 'User Management', icon: Users },
          { id: 'system-monitoring', label: 'System Monitoring', icon: Activity },
          { id: 'financial-overview', label: 'Financial Overview', icon: CreditCard },
          { id: 'data-management', label: 'Data Management', icon: Database },
          { id: 'security-alerts', label: 'Security Alerts', icon: AlertTriangle },
          { id: 'system-settings', label: 'System Settings', icon: Settings }
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Hover trigger area - invisible zone on left edge */}
      <div 
        className="fixed left-0 top-0 w-4 h-full z-40"
        onMouseEnter={() => setIsVisible(true)}
      />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card/95 backdrop-blur-lg border-r border-border/50 shadow-xl z-50 transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <nav className="p-3 h-full overflow-y-auto scrollbar-thin">
          <div className="mb-4">
            <h2 className="px-3 py-2 text-sm font-medium text-muted-foreground">
              Navigation
            </h2>
          </div>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      setIsVisible(false); // Hide sidebar after selection on mobile
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all hover:bg-accent/50",
                      activeView === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          
          {/* User info at bottom */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </nav>
      </aside>
      
      {/* Overlay for mobile */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsVisible(false)}
        />
      )}
    </>
  );
}
