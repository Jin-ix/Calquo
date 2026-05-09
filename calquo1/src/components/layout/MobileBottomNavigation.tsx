import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Home, Package, ShoppingBag, Plus, Warehouse, ChevronLeft, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Badge } from '../ui/badge';

export interface MobileBottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartItemCount?: number;
  notificationCount?: number;
  wizardConfig?: {
    show: boolean;
    canProceed: boolean;
    isSubmitting: boolean;
    isLastStep?: boolean;
    onNext: () => void;
    onBack: () => void;
  };
}

export function MobileBottomNavigation({
  currentPage,
  onNavigate,
  cartItemCount = 0,
  notificationCount = 0,
  wizardConfig
}: MobileBottomNavigationProps) {
  const { user } = useAuth();
  const mouseX = useMotionValue(Infinity);

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse', icon: Package },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartItemCount },
  ];

  if (user?.role === 'manufacturer') {
    items[1] = { id: 'my-stock', label: 'My Stock', icon: Warehouse };
    items.splice(2, 0, { id: 'add-stock', label: 'Add', icon: Plus, badge: notificationCount });
  }

  // --- Render Wizard Mode ---
  if (wizardConfig?.show) {
    return createPortal(
      <div
        className="fixed inset-0 z-[10001] flex items-end justify-center pointer-events-none p-6 pb-8 md:p-12 md:pb-12"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-950 dark:bg-black border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-2xl p-2 pointer-events-auto w-full max-w-sm transition-all duration-500"
        >
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={wizardConfig.onBack}
              className="text-zinc-400 hover:text-white hover:bg-white/10 px-4 h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button
              onClick={wizardConfig.onNext}
              disabled={!wizardConfig.canProceed || wizardConfig.isSubmitting}
              className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.97] shadow-lg shadow-black/20 relative overflow-hidden group
                ${wizardConfig.isLastStep 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-white text-black hover:bg-zinc-100'}
                ${(!wizardConfig.canProceed || wizardConfig.isSubmitting) && 'opacity-50 grayscale'}
              `}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {wizardConfig.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
                ) : (
                  <>
                    <span>{wizardConfig.isLastStep ? 'Publish Now' : 'Continue'}</span>
                    {!wizardConfig.isLastStep && <ChevronLeft className="h-4 w-4 rotate-180" />}
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  }

  // --- Render Normal Mode ---
  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-end justify-center pointer-events-none p-6 pb-8 md:p-12 md:pb-12"
    >
      <div
        className="pointer-events-auto flex h-16 w-full max-w-md mx-auto items-center justify-around rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 px-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-50 pointer-events-none" />
        {items.map((item) => (
          <DockIcon
            key={item.id}
            item={item}
            isActive={currentPage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

function DockIcon({
  item,
  isActive,
  onClick,
}: {
  mouseX?: any;
  item: any;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative group focus:outline-none flex flex-col items-center justify-center pwa-touch-target touch-manipulation flex-1 h-full`}
    >
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors relative
          ${isActive
            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
            : 'bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10'}
        `}
      >
        <item.icon className={`transition-all duration-200 ${isActive ? 'w-5 h-5' : 'w-5 h-5 group-hover:scale-110'}`} />

        {item.badge > 0 && (
          <Badge className={`absolute -top-1 -right-2 h-4 min-w-[16px] bg-red-500 text-white border-0 flex items-center justify-center px-1 py-0 text-[10px] shadow-sm z-10 font-bold rounded-full`}>
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </div>

      <span className={`text-[10px] mt-1 font-semibold transition-colors ${isActive ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
        {item.label}
      </span>
    </button>
  );
}

// Hook for managing mobile navigation state (Kept intact)
export function useMobileNavigation() {
  const [currentPage, setCurrentPage] = React.useState('home');

  const navigate = (page: string) => {
    setCurrentPage(page);

    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return {
    currentPage,
    navigate,
    setCurrentPage
  };
}
