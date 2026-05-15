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
import { AddStockWizard } from '../stock/AddStockWizard';
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
  const { stocks: allStocks, deleteStock, addStock } = useStock();

  // Handle stock submission from Wizard
  const handleWizardSubmit = async (stockItem: any) => {
    try {
      console.log('🏗️ ManufacturerDashboard: Submitting stock via Wizard...', stockItem.name);
      await addStock(stockItem);
      toast.success('Product published successfully!');
      setActiveTab('my-stock'); // Redirect to my stock view
    } catch (error) {
      console.error('ManufacturerDashboard: Wizard submission failed:', error);
      toast.error('Failed to publish product');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      {/* Modern Header Section */}
      <header className="relative bg-white border-b border-slate-100 px-6 py-8 z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-orange-50/30 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-100/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <Factory size={22} />
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 font-bold px-3 py-1">
                MANUFACTURER PORTAL
              </Badge>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mt-1">
              {user?.company || 'Company'} <span className="text-orange-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <Clock size={16} className="text-orange-400" />
              Performance Overview • {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <MagneticButton>
              <Button
                onClick={() => setActiveTab('add-stock')}
                className="bg-slate-900 hover:bg-black text-white px-6 py-6 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 group flex items-center gap-2"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                List New Product
              </Button>
            </MagneticButton>
            <Button
              variant="outline"
              className="bg-white border-slate-200 text-slate-600 px-4 py-6 rounded-2xl font-semibold hover:bg-slate-50 transition-all"
            >
              <Settings size={20} />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Dashboard Tabs Section */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <div className="sticky top-4 z-40 mb-10">
            <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-[24px] border border-white/50 shadow-2xl shadow-slate-200/50 inline-flex w-full md:w-auto">
              <TabsList className="bg-transparent h-12 gap-1 p-0">
                <TabsTrigger
                  value="home"
                  className="rounded-[18px] px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300 font-bold text-slate-500"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="my-stock"
                  className="rounded-[18px] px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300 font-bold text-slate-500"
                >
                  Inventory
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="rounded-[18px] px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300 font-bold text-slate-500"
                >
                  Order Hub
                </TabsTrigger>
                <TabsTrigger
                  value="approvals"
                  className="rounded-[18px] px-6 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300 font-bold text-slate-500"
                >
                  Approvals
                </TabsTrigger>
                <TabsTrigger
                  value="add-stock"
                  className="rounded-[18px] px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all duration-300 font-bold text-slate-500"
                >
                  + Publish Stock
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="home" className="m-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Key Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Total Products", icon: Package, value: stats.totalProducts, detail: "+12 new this month" },
                  { title: "Active Orders", icon: ShoppingCart, value: stats.activeOrders, detail: "+8 from last week" },
                  { title: "Monthly Revenue", icon: DollarSign, value: stats.monthlyRevenue, detail: "+15% from last month", formatCurrency: true },
                  { title: "Capacity", icon: Zap, value: stats.productionCapacity, detail: "All systems operational", suffix: "%" }
                ].map((item, i) => (
                  <HoverGlowCard key={item.title} className="rounded-2xl">
                    <Card className="border-slate-100 shadow-sm rounded-2xl h-full overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{item.title}</CardTitle>
                        <item.icon className="h-4 w-4 text-slate-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                          {item.formatCurrency ? formatCurrency(item.value) : item.value}{item.suffix}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
                      </CardContent>
                    </Card>
                  </HoverGlowCard>
                ))}
              </div>

              {/* Top Performing Products */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-lg">Top Performing Products</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {mockProductPerformance.map((product) => (
                        <div key={product.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <Package size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{product.name}</p>
                              <p className="text-xs text-slate-500">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{formatCurrency(product.revenue)}</p>
                            <Badge className="bg-green-50 text-green-700 border-green-100">+{product.growthPercent}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {mockActiveOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{order.id}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">{order.status}</Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-700 truncate">{order.clientName}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">{order.quantity} units</span>
                          <span className="text-xs font-bold text-orange-600">{formatCurrency(order.value)}</span>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-slate-500 text-sm font-bold" onClick={() => setActiveTab('orders')}>
                      View All Orders
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="my-stock" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
              <MyStockView
                onAddStock={() => setActiveTab('add-stock')}
                onEditStock={(stock) => setStockToEdit(stock)}
                onViewDetails={(stock) => console.log('View details:', stock)}
              />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <UnifiedOrderManagement userRole="supplier" />
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <ApprovalPanel />
            </div>
          </TabsContent>

          <TabsContent value="add-stock" className="m-0 focus-visible:outline-none">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AddStockWizard
                onSubmit={handleWizardSubmit}
                onCancel={() => setActiveTab('home')}
                navigation={{
                  currentPage: 'add-stock',
                  onNavigate: (page) => {
                    if (page === 'my-stock') setActiveTab('my-stock');
                    else if (page === 'home') setActiveTab('home');
                  },
                  cartItemCount: 0,
                  notificationCount: 0
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <EditStockForm
        stock={stockToEdit}
        isOpen={!!stockToEdit}
        onClose={() => setStockToEdit(null)}
      />
    </div>
  );
}
