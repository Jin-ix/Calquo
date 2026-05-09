import { useCallback } from 'react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  navigationHistory: string[];
  setNavigationHistory: (history: string[] | ((prev: string[]) => string[])) => void;
}

export function useNavigation(props: NavigationProps) {
  const { activeView, setActiveView, navigationHistory, setNavigationHistory } = props;

  const navigateTo = useCallback((view: string) => {
    if (view !== activeView) {
      try {
        setNavigationHistory(prev => [...prev, activeView]);
        setActiveView(view);
      } catch (error) {
        console.error('Navigation error:', error);
        setActiveView('browse-stock');
      }
    }
  }, [activeView, setActiveView, setNavigationHistory]);

  const navigateBack = useCallback(() => {
    try {
      if (navigationHistory.length > 0) {
        const previousView = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        setActiveView(previousView);
      } else {
        setActiveView('browse-stock');
      }
    } catch (error) {
      console.error('Navigate back error:', error);
      setActiveView('browse-stock');
    }
  }, [navigationHistory, setActiveView, setNavigationHistory]);

  const navigateToHome = useCallback(() => {
    try {
      setNavigationHistory([]);
      setActiveView('browse-stock');
    } catch (error) {
      console.error('Navigate to home error:', error);
      window.location.reload();
    }
  }, [setActiveView, setNavigationHistory]);

  const getBackDestination = useCallback((currentView: string): string => {
    const lastPage = navigationHistory[navigationHistory.length - 1];
    if (lastPage) return lastPage;
    
    const backDestinations: Record<string, string> = {
      'profile': 'settings',
      'add-stock': 'my-stock',
      'my-stock': 'browse-stock',
      'home': 'browse-stock',
      'add-item-set': 'my-item-sets',
      'my-item-sets': 'browse-stock',
      'browse-item-sets': 'browse-stock',
      'suppliers': 'browse-stock',
      'preferred-suppliers': 'suppliers',
      'manage-preferred-suppliers': 'suppliers',
      'orders': 'browse-stock',
      'purchase-requests': 'browse-stock',
      'purchase-page': 'browse-stock',
      'payments': 'orders',
      'dashboard': 'browse-stock',
      'agent-dashboard': 'browse-stock',
      'admin-dashboard': 'browse-stock',
      'admin-orders': 'admin-dashboard',
      'user-management': 'admin-dashboard',
      'system-monitoring': 'admin-dashboard',
      'financial-overview': 'admin-dashboard',
      'data-management': 'admin-dashboard',
      'security-alerts': 'admin-dashboard',
      'system-settings': 'admin-dashboard'
    };
    
    return backDestinations[currentView] || 'browse-stock';
  }, [navigationHistory]);

  return {
    navigateTo,
    navigateBack,
    navigateToHome,
    getBackDestination
  };
}
