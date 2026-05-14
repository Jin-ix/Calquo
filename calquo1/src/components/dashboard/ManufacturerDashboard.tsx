import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useAnimation, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { FirestoreConnectionSuccess, CORSErrorsNotice } from '../status/FirestoreConnectionSuccess';
import {
  Factory,
  Package,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  FileText,
  Target,
  Calendar,
  Truck,
  Eye,
  Settings,
  DollarSign,
  Star,
  Zap,
  LineChart,
  Plus,
  Building,
  Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageProvider';
import { useAuth } from '../auth/AuthProvider';
import { myStockList } from '../../utils/mockData';
import { EnhancedAddStockFormWithImages } from '../stock/EnhancedAddStockFormWithImages';
import { MyStockView } from '../views/MyStockView';
import { toast } from 'sonner';
import { UnifiedOrderManagement } from '../orders/UnifiedOrderManagement';
import { ApprovalPanel } from '../purchase/ApprovalPanel';
import { ParallaxWrapper } from '../layout/ParallaxWrapper';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { SparklineChart } from '../ui/SparklineChart';
import { SpotlightCard } from '../ui/SpotlightCard';
import { HoverGlowCard } from '../ui/HoverGlowCard';
import { MagneticButton } from '../ui/MagneticButton';
import { EditStockForm } from '../stock/EditStockForm';
import { useStock } from '../context/StockProvider';


interface ManufacturerStats {
  totalProducts: number;
  activeOrders: number;
  monthlyRevenue: number;
  productionCapacity: number;
  averageOrderValue: number;
  clientSatisfaction: number;
}

// Embedded fallback data
const mockManufacturerStats: ManufacturerStats = {
  totalProducts: 456,
  activeOrders: 87,
  monthlyRevenue: 2350000,
  productionCapacity: 85,
  averageOrderValue: 27500,
  clientSatisfaction: 94
};

const mockActiveOrders = [
  {
    id: 'MFG-ORD-001',
    clientName: 'Fashion Hub Retailers',
    product: 'Cotton T-Shirt Collection',
    quantity: 500,
    value: 125000,
    status: 'in_production' as const,
    priority: 'High',
    deliveryDate: '2024-01-28',
    progressPercent: 65
  },
  {
    id: 'MFG-ORD-002',
    clientName: 'Style Junction',
    product: 'Formal Shirt Sets',
    quantity: 200,
    value: 85000,
    status: 'quality_check' as const,
    priority: 'Medium',
    deliveryDate: '2024-01-30',
    progressPercent: 85
  },
  {
    id: 'MFG-ORD-003',
    clientName: 'Urban Wear Store',
    product: 'Denim Jacket Line',
    quantity: 150,
    value: 195000,
    status: 'packaging' as const,
    priority: 'High',
    deliveryDate: '2024-01-25',
    progressPercent: 95
  }
];

const mockProductPerformance = [
  {
    id: 'PROD-001',
    name: 'Export Quality T-Shirts',
    category: 'Casual Wear',
    totalOrders: 156,
    revenue: 890000,
    rating: 4.8,
    growthPercent: 23
  },
  {
    id: 'PROD-002',
    name: 'Corporate Formal Shirts',
    category: 'Formal Wear',
    totalOrders: 89,
    revenue: 567000,
    rating: 4.6,
    growthPercent: 18
  },
  {
    id: 'PROD-003',
    name: 'Premium Denim Collection',
    category: 'Casual Wear',
    totalOrders: 67,
    revenue: 745000,
    rating: 4.9,
    growthPercent: 35
  }
];

interface SwipeableProductCardProps {
  product: any;
  formatCurrency: (amount: number) => string;
}

function SwipeableProductCard({ product, formatCurrency }: SwipeableProductCardProps) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    controls.start({ x: 0 });
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-muted/30 mb-4">
      {/* Swipe Action Background - Analytics */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center z-0 bg-secondary/50">
        <Button
          variant="ghost"
          onClick={toggleAnalytics}
          className="flex flex-col items-center justify-center gap-1 h-full w-full rounded-none hover:bg-secondary/80"
        >
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-[10px] font-medium text-primary">Analytics</span>
        </Button>
      </div>

      <motion.div
        style={{ x, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: -96, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -40 || velocity.x < -500) {
            controls.start({ x: -96 });
          } else {
            controls.start({ x: 0 });
          }
        }}
        animate={controls}
        whileHover={{
          scale: 1.01,
          rotateX: 1,
          rotateY: -1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
          transition: { type: 'spring', stiffness: 400, damping: 25 }
        }}
        className="relative z-10 bg-background rounded-xl border group transition-colors"
      >
        <div className="p-4 bg-white/80 backdrop-blur-xl border-transparent rounded-xl group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2 hover:bg-muted"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  toggleAnalytics();
                }}
              >
                {showAnalytics ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <LineChart className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatCurrency(product.revenue)}</div>
              <Badge variant="outline" className="text-green-600 bg-green-50 transition-all duration-200 animate-in group-hover:animate-pulse group-hover:bg-green-100 group-hover:scale-105">
                +{product.growthPercent}%
              </Badge>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t bg-muted/10"
            >
              <div className="p-4 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.05em] text-muted-foreground">Total Orders</span>
                  <p className="text-xl font-bold">{product.totalOrders}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.05em] text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold">{product.rating}</span>
                    <Star className="h-4 w-4 fill-black text-black" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.05em] text-muted-foreground">Growth</span>
                  <p className="text-xl font-bold text-black">+{product.growthPercent}%</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(product.rating * 20, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>Performance Score</span>
                  <span>{Math.round(product.rating * 20)}/100</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface ManufacturerDashboardProps {
  initialTab?: string;
}

export function ManufacturerDashboard({ initialTab = 'home' }: ManufacturerDashboardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab === 'overview' ? 'home' : initialTab);
  const [stats, setStats] = useState(mockManufacturerStats);
   const [expandedMetric, setExpandedMetric] = useState<string | null>(null); // Added for Bento Morphing
  const [stockToEdit, setStockToEdit] = useState<any | null>(null);
  const { addStock } = useStock();

  const { scrollY } = useScroll();
  const headerFontWeight = useTransform(scrollY, [0, 300], [800, 400]);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(current => ({
        ...current,
        activeOrders: current.activeOrders + (Math.random() > 0.6 ? 1 : 0),
        monthlyRevenue: current.monthlyRevenue + Math.floor(Math.random() * 5000),
        productionCapacity: Math.min(100, Math.max(0, current.productionCapacity + (Math.floor(Math.random() * 3) - 1))),
        totalProducts: current.totalProducts + (Math.random() > 0.85 ? 1 : 0)
      }));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_production: { label: 'In Production', variant: 'default' as const, color: 'text-blue-600' },
      quality_check: { label: 'Quality Check', variant: 'secondary' as const, color: 'text-yellow-600' },
      packaging: { label: 'Packaging', variant: 'outline' as const, color: 'text-green-600' },
      shipped: { label: 'Shipped', variant: 'default' as const, color: 'text-purple-600' },
      review: { label: 'Under Review', variant: 'secondary' as const, color: 'text-orange-600' },
      quoted: { label: 'Quote Sent', variant: 'outline' as const, color: 'text-blue-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.review;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-7xl mx-auto w-full px-4 py-6 md:p-8 space-y-8 bg-[#FAFAFA] min-h-screen"
    >
      {/* Decor handled by ParallaxWrapper below instead of fixed div */}

      {/* Hero Parallax Section */}
      {
        activeTab === 'home' && (
          <ParallaxWrapper
            backgroundImageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            height="40vh"
            className="rounded-none md:rounded-sm mb-8 border border-[#E5E5E5] bg-zinc-950 overflow-hidden"
            overlayOpacity={0.6}
            scrimGradient="linear-gradient(to right, rgba(9,9,11,0.9), rgba(9,9,11,0.7))"
          >
            <div className="flex flex-col items-center justify-center text-center space-y-4 pt-10 relative z-10">
              <motion.h1 style={{ y: 0 }} className="text-4xl md:text-5xl font-heading drop-shadow-sm flex justify-center gap-3 pt-2 text-white">
                {["Manufacturer", "Portal"].map((word, i) => (
                  <div key={word} className="mask-text-up overflow-hidden pb-2">
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 + (i * 0.15), ease: [0.16, 1, 0.3, 1] }}
                      className={`inline-block font-[800] tracking-[-0.02em] bg-[linear-gradient(135deg,#ffffff_0%,#c3a343_100%)] bg-clip-text text-transparent ${i === 1 ? "italic font-light tracking-normal" : ""}`}
                    >
                      {word}
                    </motion.span>
                  </div>
                ))}
              </motion.h1>
              <p className="text-white/80 max-w-2xl text-lg font-light">
                Manage your production, oversee orders, and track revenue seamlessly.
              </p>
              {user && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {/* Company name badge - high contrast solid style */}
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-amber-400/50 px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg">
                    <Building className="h-4 w-4 text-amber-400" />
                    <span className="font-bold tracking-wide text-white text-sm">{user.company}</span>
                  </div>
                  {/* Verified badge - clear green with check icon */}
                  <div className="bg-emerald-500 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                    <span className="text-sm font-bold tracking-widest uppercase text-white">Verified Manufacturer</span>
                  </div>
                </div>
              )}
            </div>
          </ParallaxWrapper>
        )
      }

      {
        activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Production Status Alert */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <Alert className="border-green-400/30 bg-gradient-to-r from-green-50 to-emerald-50/50 shadow-sm backdrop-blur-sm flex items-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="mr-2"
                >
                  <Activity className="h-5 w-5 text-green-600" />
                </motion.div>
                <AlertDescription className="text-green-800 font-medium ml-1">
                  Production running at {stats.productionCapacity}% capacity. All systems operational.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Key Metrics - Bento Morphing Grid */}
            <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence>
                {[
                  {
                    id: "totalProducts",
                    title: "Total Products",
                    icon: Package,
                    borderColor: "border-[#E5E7EB]",
                    shadowColor: "shadow-none",
                    value: stats.totalProducts,
                    sparkline: [40, 42, 45, 48, 50, 52, 55, 60, 65, 68, 70],
                    detail: "+12 new this month"
                  },
                  {
                    id: "activeOrders",
                    title: "Active Orders",
                    icon: ShoppingCart,
                    borderColor: "border-[#E5E7EB]",
                    shadowColor: "shadow-none",
                    value: stats.activeOrders,
                    sparkline: [80, 82, 81, 85, 87, 86, 88, 89, 90, 87, 88],
                    detail: "+8 from last week"
                  },
                  {
                    id: "monthlyRevenue",
                    title: "Monthly Revenue",
                    icon: DollarSign,
                    borderColor: "border-[#E5E7EB]",
                    shadowColor: "shadow-none",
                    value: stats.monthlyRevenue,
                    formatCurrency: true,
                    sparkline: [100, 120, 110, 140, 130, 160, 150, 180, 190, 200],
                    detail: "+15% from last month"
                  },
                  {
                    id: "productionCapacity",
                    title: "Production Capacity",
                    icon: Zap,
                    borderColor: "border-[#E5E7EB]",
                    shadowColor: "shadow-none",
                    value: stats.productionCapacity,
                    suffix: "%",
                    sparkline: [85, 82, 80, 78, 75, 78, 80, 82, 85, 84],
                    detail: "-1% variance today"
                  }
                ].map((item, i) => {
                  const isExpanded = expandedMetric === item.id;

                  // Calculate growth/decline dynamically for insight colors
                  const startVal = item.sparkline[0];
                  const endVal = item.sparkline[item.sparkline.length - 1];
                  const isGrowth = endVal >= startVal;
                  const sparklineColor = isGrowth ? "#10b981" : "#ef4444"; // emerald-500 for growth, red-500 for decline

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      onClick={() => !isExpanded && setExpandedMetric(item.id)}
                      className={`cursor-pointer ${isExpanded ? 'md:col-span-2 lg:col-span-4 min-h-[400px]' : ''}`}
                      whileHover={!isExpanded ? { y: -4, scale: 1.01 } : {}}
                    >
                      <HoverGlowCard className="h-full rounded-sm">
                        <Card className={`relative h-full overflow-hidden bg-white/90 backdrop-blur-md border ${item.borderColor} shadow-none rounded-sm transition-all duration-300`}>
                          <SparklineChart data={item.sparkline} color={sparklineColor} />
                          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                            <motion.div layout="position">
                              <CardTitle className="text-[0.75rem] uppercase tracking-[0.05em] font-medium text-zinc-600">{item.title}</CardTitle>
                            </motion.div>
                            {isExpanded ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs z-20 hover:bg-muted"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setExpandedMetric(null);
                                }}
                              >
                                Close
                              </Button>
                            ) : (
                              <motion.div layout="position">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                            )}
                          </CardHeader>
                          <CardContent className="relative z-10 flex flex-col h-[calc(100%-4rem)]">
                            <motion.div layout="position" className={`font-bold ${isExpanded ? 'text-4xl' : 'text-2xl'}`}>
                              <AnimatedCounter
                                value={item.value}
                                formatCurrency={item.formatCurrency}
                                suffix={item.suffix}
                              />
                            </motion.div>
                            <motion.p layout="position" className="text-[0.65rem] uppercase tracking-[0.05em] text-muted-foreground mt-1">
                              {item.detail}
                            </motion.p>

                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="mt-6 flex-1 border rounded-lg bg-white/50 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-muted-foreground"
                              >
                                <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm">Detailed Analytics for {item.title}</p>
                                <p className="text-xs opacity-70">Interactive data tables & trends will appear here.</p>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </HoverGlowCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              {/* Top Performing Products */}
              <SpotlightCard>
                <Card className="bg-white border border-[#E5E7EB] rounded-sm shadow-none overflow-hidden">
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl tracking-tight">Top Performing Products</CardTitle>
                    <CardDescription className="uppercase tracking-[0.05em] text-[0.65rem] mt-1">Swipe left or click chart icon for detailed analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 relative z-10">
                      {mockProductPerformance.slice(0, 3).map((product) => (
                        <SwipeableProductCard
                          key={product.id}
                          product={product}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>
          </motion.div>
        )
      }

      {
        activeTab === 'my-stock' && (
          <MyStockView
            onAddStock={() => setActiveTab('add-stock')}
            onEditStock={(stock) => {
              setStockToEdit(stock);
            }}
            onViewDetails={(stock) => {
              console.log('View details:', stock);
            }}
          />
        )
      }

      <EditStockForm
        stock={stockToEdit}
        isOpen={!!stockToEdit}
        onClose={() => setStockToEdit(null)}
      />

      {
        activeTab === 'add-stock' && (
          <EnhancedAddStockFormWithImages
            onSubmit={async (stockItem) => {
              console.log('🚀 [ManufacturerDashboard] Submitting stock item:', stockItem.name);
              const success = await addStock(stockItem);
              if (success) {
                setActiveTab('my-stock');
              }
            }}
            onCancel={() => {
              setActiveTab('my-stock');
            }}
          />
        )
      }

      {
        activeTab === 'orders' && (
          <UnifiedOrderManagement userRole="supplier" />
        )
      }

      {
        activeTab === 'approvals' && (
          <ApprovalPanel />
        )
      }
    </motion.div >
  );
}
