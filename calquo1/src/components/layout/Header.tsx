import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage, Language } from '../context/LanguageProvider';
import { CartBadge } from '../cart/CartBadge';
import { NotificationBell, NotificationPanel } from '../notifications/NotificationSystem';
import { LogOut, Settings, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
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

interface HeaderProps {
  onSettingsClick: () => void;
  onCartClick?: () => void;
  onNavigate: (page: string) => void;
}

export function Header({ onSettingsClick, onCartClick, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'default';
      case 'warehouse': return 'secondary';
      case 'retailer': return 'outline';
      case 'financial': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-base sm:text-lg font-medium tracking-tight">CALICO</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium line-clamp-1">{user.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{user.profile.company}</p>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {t(`auth.${user.role}`)}
                </Badge>
              </div>

              {/* Mobile - Show only role badge */}
              <div className="sm:hidden">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {t(`auth.${user.role}`)}
                </Badge>
              </div>

              {/* Enhanced Notification Bell - Compact for mobile */}
              <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                    <NotificationBell />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <NotificationPanel />
                </PopoverContent>
              </Popover>

              {/* Theme Toggle Button */}
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2" aria-label="Toggle theme">
                {isDarkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* VTON Studio - Hidden on mobile */}
              <Button variant="ghost" size="sm" onClick={() => onNavigate('vton')} className="hidden sm:flex h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 group" title="Virtual Try-On Studio">
                <Sparkles className="h-4 w-4 group-hover:text-purple-500 transition-colors" />
              </Button>

              {/* Settings - Hidden on mobile */}
              <Button variant="ghost" size="sm" onClick={onSettingsClick} className="hidden sm:flex h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                <Settings className="h-4 w-4" />
              </Button>

              {/* Cart Button - Moved near logout */}
              {(user.role === 'retailer' || user.role === 'trader') && onCartClick && (
                <div className="flex items-center">
                  <CartBadge onClick={onCartClick} />
                </div>
              )}

              {/* Logout - Show as compact icon on mobile */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors group">
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 group-hover:-translate-x-1 transition-transform duration-300" />
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
            </>
          )}

          {/* Language Selector - Compact for mobile */}
          <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
            <SelectTrigger className="w-10 h-8 sm:w-16 border-0 bg-transparent p-1 sm:p-2">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline">
                  <SelectValue />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇺🇸 English</SelectItem>
              <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
              <SelectItem value="ml">🇮🇳 മലയാളം</SelectItem>
              <SelectItem value="ta">🇮🇳 தமিழ্</SelectItem>
              <SelectItem value="te">🇮🇳 తెలుగు</SelectItem>
              <SelectItem value="gu">🇮🇳 ગુજરাতી</SelectItem>
              <SelectItem value="kn">🇮🇳 ಕನ್ನಡ</SelectItem>
              <SelectItem value="bn">🇮🇳 বাংলা</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
