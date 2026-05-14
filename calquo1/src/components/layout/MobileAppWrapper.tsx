import React, { useState, useEffect } from 'react';
import { MobileBottomNavigation, useMobileNavigation } from './MobileBottomNavigation';
import { MobileHeader } from './MobileHeader';
import { HomePage } from '../home/HomePage';
import { EnhancedBrowseStockPage } from '../stock/EnhancedBrowseStockPage';
import { MyStockView } from '../views/MyStockView';
import { CartView } from '../cart/CartView';
import { AnalyticsDashboard } from '../dashboard/AnalyticsDashboard';
import { SettingsPanel } from './SettingsPanel';
import { NotificationPanel } from '../notifications/NotificationSystem';
import { AddStockWizard } from '../stock/AddStockWizard';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { useStock } from '../context/StockContext';
import { useOrders } from '../context/OrderProvider';
import { UnifiedOrderManagement } from '../orders/UnifiedOrderManagement';
import { MyOrdersView } from '../orders/MyOrdersView';
import { FinancialApprovals } from '../dashboard/FinancialApprovals';
import { FinancialClients } from '../dashboard/FinancialClients';
import { FinancialPayments } from '../dashboard/FinancialPayments';

import { NewPickupsPage } from '../logistics/NewPickupsPage';
import { TodaysPickupsPage } from '../logistics/TodaysPickupsPage';
import { InTransitPage } from '../logistics/InTransitPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface MobileAppWrapperProps {
  user: any;
  onPageChange?: (page: string) => void;
}

export function MobileAppWrapper({ user, onPageChange }: MobileAppWrapperProps) {
  const { currentPage, navigate, setCurrentPage } = useMobileNavigation();
  const [notificationCount, setNotificationCount] = useState(3); // Demo notification count
  const [showAddStockDialog, setShowAddStockDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<any | null>(null);
  const { addStock, updateStock } = useStock();
  const { getMyOrders } = useOrders();
  
  // Safely get cart data with error handling
  let cartItemCount = 0;
  try {
    const { cartSummary } = useCart();
    cartItemCount = cartSummary?.totalItems || 0;
  } catch (error) {
    console.warn('Failed to get cart data:', error);
    cartItemCount = 0;
  }

  // Handle page navigation
  const handleNavigate = (page: string) => {
    // If the Add Stock dialog is open and we're navigating elsewhere, close it
    if (showAddStockDialog && page !== 'add-stock') {
      setShowAddStockDialog(false);
    }

    // Handle special action: add-stock
    if (page === 'add-stock') {
      handleAddStock();
      return;
    }
    
    // Map quick action routes to mobile pages
    const pageMapping: Record<string, string> = {
      'browse-stock': 'browse',
      // 'orders' now maps to 'orders' directly
      'my-orders': 'orders', // Map my-orders to orders page
      'suppliers': 'browse',
    };
    
    const targetPage = pageMapping[page] || page;
    navigate(targetPage);
    onPageChange?.(targetPage);
  };

  // Handle Add Stock action
  const handleAddStock = () => {
    // Check if user is allowed to add stock
    const allowedRoles = ['manufacturer', 'trader', 'warehouse', 'admin'];
    if (!user?.role || !allowedRoles.includes(user.role)) {
      toast.error('Only manufacturers, traders, and admins can add stock');
      return;
    }
    
    setEditingStock(null);
    setShowAddStockDialog(true);
  };

  // Handle Edit Stock action
  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setShowAddStockDialog(true);
  };
  
  // Check if user can add stock
  const canAddStock = ['manufacturer', 'trader', 'warehouse', 'admin'].includes(user?.role || '');

  // Handle stock submission
  const handleStockSubmit = async (stockData: any) => {
    try {
      console.log('📦 Saving stock via StockProvider');
      if (editingStock) {
         await updateStock(editingStock.id, stockData);
      } else {
         await addStock(stockData);
      }
      
      setShowAddStockDialog(false);
      setEditingStock(null);
      // Toast is already shown by AddStockWizard or StockProvider
      // Navigate to my-stock page to see the new stock
      navigate('my-stock');
    } catch (error) {
      console.error('Error in handleStockSubmit:', error);
      setShowAddStockDialog(false);
      setEditingStock(null);
      navigate('my-stock');
    }
  };

  // Handle dialog close
  const handleCloseAddStock = () => {
    setShowAddStockDialog(false);
    setEditingStock(null);
  };

  // Sync with URL path on mount and role change
  useEffect(() => {
    if (!user?.role) return;

    const path = window.location.pathname;
    
    // Map URL paths to internal view states
    if (path === '/add-stock') {
      // Check if user is allowed to add stock
      const allowedRoles = ['manufacturer', 'trader', 'warehouse', 'admin'];
      if (allowedRoles.includes(user.role)) {
        setShowAddStockDialog(true);
        setCurrentPage('my-stock'); // Show stock page in background
      } else {
        setCurrentPage('home');
      }
    } else if (path === '/cart') {
      setCurrentPage('cart');
    } else if (path === '/orders') {
      setCurrentPage('orders');
    } else if (path === '/browse' || path === '/browse-stock') {
      setCurrentPage('browse');
    } else if (path === '/my-stock') {
      setCurrentPage('my-stock');
    } else if (path === '/approvals') {
      setCurrentPage('approvals');
    } else if (path === '/payments') {
      setCurrentPage('payments');
    } else if (path === '/clients') {
      setCurrentPage('clients');
    } else if (path === '/analytics') {
      setCurrentPage('analytics');
    } else if (path === '/settings') {
      setCurrentPage('settings');
    } else {
      // Default initial page
      setCurrentPage('home');
    }
  }, [user?.role, setCurrentPage]);

  // Get page title based on current page
  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'CALICO';
      case 'browse': return 'Browse Stock';
      case 'my-stock': return 'My Stock';
      case 'cart': return 'Shopping Cart';
      case 'orders': return 'Orders';
      case 'approvals': return 'Approvals';
      case 'payments': return 'Payments';
      case 'clients': return 'Clients';
      case 'analytics': return 'Analytics';
      case 'notifications': return 'Notifications';

      case 'settings': return 'Settings';
      case 'new': return 'New Pickups';
      case 'today': return 'Today\'s Pickups';
      case 'transit': return 'In Transit';
      default: return 'CALICO';
    }
  };

  // Render current page content
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="mobile-content-padding">
            <HomePage onNavigate={handleNavigate} currentView={currentPage} />
          </div>
        );
      
      case 'browse':
        return (
          <div className="mobile-content-padding">
            <EnhancedBrowseStockPage />
          </div>
        );
      
      case 'my-stock':
        return (
          <div className="mobile-content-padding">
            <MyStockView 
              onAddStock={handleAddStock}
              onEditStock={handleEditStock}
              onViewDetails={() => {}}
            />
          </div>
        );
      
      case 'cart':
        return (
          <div className="mobile-content-padding">
            <div className="p-4">
              <h1 className="text-xl mb-4">Shopping Cart</h1>
              <CartView onContinueShopping={() => navigate('browse')} />
            </div>
          </div>
        );
      
      case 'orders':
        const myOrders = getMyOrders(user?.company || '');
        // Determine which view to show based on role (matching AppMain.tsx logic)
        if (user?.role === 'retailer') {
          return (
             <div className="mobile-content-padding">
              <MyOrdersView
                orders={myOrders}
                onReturnRequest={(orderId, reason) => {
                  console.log('Return request:', orderId, reason);
                  toast.success('Return request submitted successfully!');
                }}
              />
            </div>
          );
        }
        
        // For manufacturers, traders, warehouse - show UnifiedOrderManagement
        return (
           <div className="mobile-content-padding">
            <UnifiedOrderManagement 
              userRole={
                (user?.role === 'manufacturer' || user?.role === 'warehouse') ? 'supplier' :
                (user?.role as any) || 'trader'
              } 
            />
          </div>
        );

      case 'approvals':
        // Route based on user role
        if (user?.role === 'logistics_agent' || user?.role === 'logistics-agent') {
          return (
            <div className="mobile-content-padding">
              <UnifiedOrderManagement userRole="logistics_agent" />
            </div>
          );
        } else if (user?.role === 'financial_agent' || user?.role === 'financial') {
          return (
            <div className="mobile-content-padding">
              <FinancialApprovals onBack={() => handleNavigate('home')} />
            </div>
          );
        } else {
          // Fallback for other roles
          return (
            <div className="mobile-content-padding">
              <UnifiedOrderManagement userRole={user?.role || 'retailer'} />
            </div>
          );
        }

      case 'payments':
        return (
          <div className="mobile-content-padding">
            <FinancialPayments onBack={() => handleNavigate('home')} />
          </div>
        );

      case 'clients':
        return (
          <div className="mobile-content-padding">
            <FinancialClients onBack={() => handleNavigate('home')} />
          </div>
        );



      case 'analytics':
        return (
          <div className="mobile-content-padding">
            <AnalyticsDashboard />
          </div>
        );
      
      case 'notifications':
        return (
          <div className="mobile-content-padding">
            <div className="p-4 h-full">
              <h1 className="text-xl mb-4">Notifications</h1>
              <NotificationPanel fullPage={true} />
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="mobile-content-padding">
            <div className="p-4">
              <h1 className="text-xl mb-4">Settings</h1>
              <SettingsPanel onProfileClick={() => {}} />
            </div>
          </div>
        );

      case 'new':
        return (
          <div className="mobile-content-padding">
            <NewPickupsPage onBack={() => handleNavigate('home')} />
          </div>
        );

      case 'today':
        return (
          <div className="mobile-content-padding">
            <TodaysPickupsPage onBack={() => handleNavigate('home')} />
          </div>
        );

      case 'transit':
        return (
          <div className="mobile-content-padding">
            <InTransitPage onBack={() => handleNavigate('home')} />
          </div>
        );
      
      default:
        return (
          <div className="mobile-content-padding">
            <HomePage onNavigate={handleNavigate} currentView={currentPage} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <MobileHeader
        title={getPageTitle()}
        showSearch={currentPage === 'browse'}
        onNavigate={handleNavigate}
        notificationCount={notificationCount}
        cartItemCount={cartItemCount}
      />

      {/* Main content area */}
      <main className="min-h-screen">
        {renderCurrentPage()}
      </main>

      {/* Mobile bottom navigation */}
      {!showAddStockDialog && (
        <MobileBottomNavigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          cartItemCount={cartItemCount}
          notificationCount={notificationCount}
        />
      )}

      {/* Add Stock Wizard - Full Screen Portal */}
      {showAddStockDialog && (
        <AddStockWizard
          onSubmit={handleStockSubmit}
          onCancel={handleCloseAddStock}
          isEditing={!!editingStock}
          initialStock={editingStock}
          navigation={{
            currentPage,
            onNavigate: handleNavigate,
            setActiveTab: setCurrentPage,
            cartItemCount,
            notificationCount
          }}
        />
      )}
    </div>
  );
}
