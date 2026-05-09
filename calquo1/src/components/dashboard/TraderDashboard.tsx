import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  TrendingUp,
  Package,
  Target,
  Handshake,
  Globe,
  Sparkles,
  Building,
  ChevronRight,
  Search,
  Plus,
  FileText,
  Warehouse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageProvider';
import { useAuth } from '../auth/AuthProvider';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { traderDashboardContent } from '../../utils/traderDashboardContent';
import { motion } from 'framer-motion';
import { ParallaxWrapper } from '../layout/ParallaxWrapper';
import { AnimatedCounter } from '../ui/AnimatedCounter';

// --- Types & Mock Data ---

interface TraderStats {
  totalDeals: number;
  activeContracts: number;
  monthlyProfit: number;
  successRate: number;
  averageDealValue: number;
  portfolioValue: number;
}

const mockTraderStats: TraderStats = {
  totalDeals: 234,
  activeContracts: 45,
  monthlyProfit: 1850000,
  successRate: 87,
  averageDealValue: 125000,
  portfolioValue: 8900000
};

// --- Main Component ---

interface TraderDashboardProps {
  onNavigate?: (view: string) => void;
  view?: string; // Kept for compatibility but unused
  initialTab?: string; // Kept for compatibility but unused
}

export function TraderDashboard({ onNavigate }: TraderDashboardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats] = useState(mockTraderStats);

  // Theme Constants (Adapted for Premium Themes)
  const THEME_COLOR = 'var(--primary)';
  const THEME_BG = 'var(--accent)';

  const handleNavigate = (target: string) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  // Images for recommendations (Preserved)
  const recommendationImages = [
    'https://images.unsplash.com/photo-1581096297221-e4c043c2b7ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBibG9jayUyMHByaW50JTIwc2NhcnZlcyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDAxNzEwOHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1700547949736-024ad8cb56cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5hcmFzaSUyMHNpbGslMjBmYWJyaWMlMjBnb2xkfGVufDF8fHx8MTc2MDAxNzEwOHww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1610189337543-1c5d8e64f574?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFuZGVyaSUyMHNhcmVlJTIwcGFzdGVsJTIwY29sb3JzfGVufDF8fHx8MTc2MDAxNzEwOXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1616057653867-d3edfb20a736?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeW50aGV0aWMlMjBkcmVzcyUyMGZhYnJpYyUyMHJvbGxzfGVufDF8fHx8MTc2MDAxNzExMnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1639155227676-d2bf977fba4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3RhJTIwZG9yaWElMjBmYWJyaWMlMjBsaWdodHdlaWdodHxlbnwxfHx8fDE3NjAwMTcxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-8 bg-background text-foreground min-h-screen relative overflow-hidden"
    >
      {/* Hero Parallax Section */}
      <ParallaxWrapper
        backgroundImageUrl="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=2574&auto=format&fit=crop"
        height="35vh"
        className="rounded-2xl mb-8 border border-white/20 shadow-2xl"
        overlayOpacity={0.15}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4 pt-10">
          <div className="p-3 rounded-full bg-accent-gold/20 backdrop-blur-md border border-accent-gold/30 mb-2">
            <TrendingUp className="h-8 w-8 text-accent-gold-light" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading text-slate-900 drop-shadow-sm overflow-hidden pt-2">
            <div className="mask-text-up">
              <span>
                Trader <span className="text-accent-gold-light italic">Exchange</span>
              </span>
            </div>
          </h1>
          <p className="text-white/80 max-w-2xl text-lg font-light">
            Discover opportunities, manage your portfolio, and expand your market reach.
          </p>
          {user && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div className="glass-panel px-4 py-1.5 rounded-full flex items-center gap-2 border-white/20 text-white shadow-lg">
                <span className="font-medium tracking-wide">{user.company}</span>
              </div>
            </div>
          )}
        </div>
      </ParallaxWrapper>

      {/* Navigation Cards (Menu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Browse Stock Card */}
        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-border/50 shadow-xl shadow-primary/5 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 transition-all relative overflow-hidden group bg-card/80 backdrop-blur-xl"
            onClick={() => handleNavigate('browse-stock')}
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search className="h-24 w-24" style={{ color: THEME_COLOR }} />
            </div>
            <CardContent className="p-6 text-card-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground/60">Browse Stock</p>
                  <h3 className="text-2xl font-bold mt-2">Marketplace</h3>
                </div>
                <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                  <Search className="h-5 w-5" style={{ color: THEME_COLOR }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
                Find Products <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Stock Card */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card
            className="border-border/50 shadow-lg shadow-primary/5 cursor-pointer hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden group bg-card/80 backdrop-blur-xl"
            onClick={() => handleNavigate('my-stock')}
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Warehouse className="h-24 w-24" style={{ color: THEME_COLOR }} />
            </div>
            <CardContent className="p-6 text-card-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground/60">My Stock</p>
                  <h3 className="text-2xl font-bold mt-2"><AnimatedCounter value={stats.totalDeals} /> Items</h3>
                </div>
                <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                  <Warehouse className="h-5 w-5" style={{ color: THEME_COLOR }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
                Manage Inventory <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders Card */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <Card
            className="border-border/50 shadow-lg shadow-primary/5 cursor-pointer hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden group bg-card/80 backdrop-blur-xl"
            onClick={() => handleNavigate('orders')}
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="h-24 w-24" style={{ color: THEME_COLOR }} />
            </div>
            <CardContent className="p-6 text-card-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground/60">Orders</p>
                  <h3 className="text-2xl font-bold mt-2"><AnimatedCounter value={stats.activeContracts} /> Active</h3>
                </div>
                <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                  <FileText className="h-5 w-5" style={{ color: THEME_COLOR }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
                View Orders <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Stock Card */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, delay: 0.15 }}>
          <Card
            className="border-border/50 shadow-lg shadow-primary/5 cursor-pointer hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden group bg-card/80 backdrop-blur-xl"
            onClick={() => handleNavigate('add-stock')}
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Plus className="h-24 w-24" style={{ color: THEME_COLOR }} />
            </div>
            <CardContent className="p-6 text-card-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground/60">Add Stock</p>
                  <h3 className="text-2xl font-bold mt-2">New Item</h3>
                </div>
                <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                  <Plus className="h-5 w-5" style={{ color: THEME_COLOR }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
                Create Listing <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* --- PRESERVED DEMO PRODUCTS SECTIONS --- */}

      {/* Recommended Trade Opportunities */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold">Recommended Trade Opportunities</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {traderDashboardContent.recommendations.map((rec, index) => (
            <motion.div key={index} whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
              <Card className="overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 border-border/50 hover:border-primary/20 shadow-sm h-full flex flex-col bg-card/80 backdrop-blur-xl text-card-foreground">
                <div className="aspect-[4/3] overflow-hidden bg-accent/20 relative group">
                  <ImageWithFallback
                    src={recommendationImages[index]}
                    alt={rec.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white font-medium">{rec.name}</p>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{rec.origin}</Badge>
                      <span className="font-bold text-green-600">{rec.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{rec.rationale}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200 mt-2">
                    <Handshake className="h-4 w-4 mr-2" />
                    {rec.button}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personalized Trade Recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Personalized Trade Recommendations
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          {traderDashboardContent.recommendations.map((rec, index) => (
            <motion.div key={index} whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
              <Card className="overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 border-border/50 hover:border-primary/20 shadow-sm group h-full flex flex-col bg-card/80 backdrop-blur-xl text-card-foreground">
                <div className="aspect-square overflow-hidden bg-accent/20">
                  <ImageWithFallback
                    src={rec.imageUrl}
                    alt={rec.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm line-clamp-1">{rec.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-end">
                  <div className="space-y-1 mb-2">
                    <p className="text-sm font-bold text-green-600">{rec.price}</p>
                    <p className="text-xs text-foreground/60 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {rec.origin}
                    </p>
                  </div>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground hover:opacity-90 h-8 text-xs mt-auto">
                    View
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
