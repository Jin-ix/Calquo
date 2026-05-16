import React from 'react';
import { ArrowLeft, LogOut, Search, Bell, Settings, ShoppingCart, Menu, BarChart3, Home, Package, PlusCircle, ClipboardList, Store, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription
} from '../ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useAuth } from '../auth/AuthProvider';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onNavigate?: (page: string) => void;
  notificationCount?: number;
  cartItemCount?: number;
}

export function MobileHeader({
  title,
  showBack = false,
  showSearch = false,
  onBack,
  onSearch,
  onNavigate,
  notificationCount = 0,
  cartItemCount = 0
}: MobileHeaderProps) {
  const { logout, user } = useAuth();

  const handleSearch = (value: string) => {
    onSearch?.(value);

    // Dispatch custom event for pages listening to search
    const event = new CustomEvent('mobile-search', { detail: value });
    window.dispatchEvent(event);
  };

  const canSeeCart = ['retailer', 'trader', 'warehouse', 'admin'].includes(user?.role || '');

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-black/5 transition-all duration-500">
      {/* Safe area top padding */}
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 h-16 md:h-20">
          {/* Left side - Back button or Menu */}
          <div className="flex items-center gap-4 flex-1">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            {!showBack && onNavigate && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-slate-900" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    {user && (
                      <div className="text-left mt-2 mb-2 p-3 bg-muted rounded-lg border">
                        <div className="font-semibold text-sm">{user.company}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role} Account</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                      </div>
                    )}
                    <SheetDescription className="sr-only">
                      Mobile navigation menu
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 py-4">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                        onClick={() => onNavigate('home')}
                      >
                        <Home className="mr-4 h-4 w-4" />
                        Home
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                        onClick={() => onNavigate('vton')}
                      >
                        <Sparkles className="mr-4 h-4 w-4" />
                        Virtual Try-On
                      </Button>
                    </SheetClose>

                    {/* Manufacturer Menu */}
                    {user?.role === 'manufacturer' && (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('my-stock')}
                          >
                            <Package className="mr-4 h-4 w-4" />
                            My Stock
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('add-stock')}
                          >
                            <PlusCircle className="mr-4 h-4 w-4" />
                            Add Stock
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('orders')}
                          >
                            <ClipboardList className="mr-4 h-4 w-4" />
                            Orders
                          </Button>
                        </SheetClose>
                      </>
                    )}

                    {/* Retailer Menu */}
                    {user?.role === 'retailer' && (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('shop')}
                          >
                            <Store className="mr-4 h-4 w-4" />
                            Marketplace
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('orders')}
                          >
                            <ClipboardList className="mr-4 h-4 w-4" />
                            My Orders
                          </Button>
                        </SheetClose>
                      </>
                    )}

                    {/* Trader Menu */}
                    {(user?.role === 'trader' || user?.role === 'wholesaler') && (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('shop')}
                          >
                            <Store className="mr-4 h-4 w-4" />
                            Marketplace
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('my-stock')}
                          >
                            <Package className="mr-4 h-4 w-4" />
                            My Stock
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                            onClick={() => onNavigate('orders')}
                          >
                            <ClipboardList className="mr-4 h-4 w-4" />
                            Orders
                          </Button>
                        </SheetClose>
                      </>
                    )}

                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 hover:text-black rounded-none border-l-4 border-transparent hover:border-black h-12 transition-all"
                        onClick={() => onNavigate('analytics')}
                      >
                        <BarChart3 className="mr-4 h-4 w-4" />
                        Analytics
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tighter uppercase ml-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">{title}</h1>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 transition-colors text-slate-900"
              >
                <Search className="h-5 w-5 stroke-[1.5]" />
              </Button>
            )}

            {/* User Info - Premium aesthetic */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 mr-4 group cursor-pointer pr-4 border-r border-slate-200">
                <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm ring-2 ring-transparent group-hover:ring-slate-300 transition-all duration-300">
                  {user.company?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-900 truncate max-w-[140px] group-hover:text-slate-600 transition-colors">{user.company}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{user.role}</span>
                </div>
              </div>
            )}

            {/* Cart - Visible for allowed roles */}
            {onNavigate && canSeeCart && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('cart')}
                className="h-10 w-10 p-0 relative rounded-full hover:bg-slate-100 transition-colors text-slate-900 group"
                title="Cart"
              >
                <ShoppingCart className="h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform duration-300" />
                {cartItemCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </Button>
            )}

            {/* Alerts / Notifications */}
            {onNavigate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('notifications')}
                className="h-10 w-10 p-0 relative rounded-full hover:bg-slate-100 transition-colors text-slate-900 group"
                title="Alerts"
              >
                <Bell className="h-5 w-5 stroke-[1.5] group-hover:scale-110 transition-transform duration-300" />
                {notificationCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </Button>
            )}

            {/* Settings */}
            {onNavigate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('settings')}
                className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 transition-colors text-slate-900 group"
                title="Settings"
              >
                <Settings className="h-5 w-5 stroke-[1.5] group-hover:rotate-45 transition-transform duration-500" />
              </Button>
            )}

            {/* Logout button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors group ml-1"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 stroke-[1.5] group-hover:-translate-x-1 transition-transform duration-300" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[92vw] max-w-md p-0 overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl">
                
                {/* Modern top header graphic */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                  {/* Abstract shapes */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl" />
                  
                  {/* Center icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse" />
                      <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center relative rotate-3 group-hover:rotate-0 transition-transform duration-300">
                        <LogOut className="h-7 w-7 text-red-500 translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-8 flex flex-col items-center text-center relative z-10">
                  <AlertDialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                    Sign out of CALIQUO?
                  </AlertDialogTitle>
                  
                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed max-w-[280px] mx-auto">
                    You are currently signed in as <br/>
                    <span className="inline-flex items-center justify-center mt-3 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      {user?.company || 'your account'}
                    </span>
                  </AlertDialogDescription>

                  <AlertDialogFooter className="w-full flex gap-3 sm:gap-4 m-0 flex-row">
                    <AlertDialogCancel className="!m-0 flex-1 h-12 rounded-xl !bg-white dark:!bg-slate-800 !text-slate-700 dark:!text-slate-200 border border-slate-200 dark:border-slate-700 font-medium hover:!bg-slate-50 dark:hover:!bg-slate-700 transition-colors text-base">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => logout()} 
                      className="!m-0 flex-1 h-12 rounded-xl !bg-red-600 !text-white border border-transparent font-medium hover:!bg-red-700 shadow-sm transition-colors text-base"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Search bar if enabled */}
        {showSearch && (
          <div className="px-4 pb-4">
          </div>
        )}
      </div>
    </div>
  );
}
