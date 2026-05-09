import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FirestoreConnectionSuccess, CORSErrorsNotice } from '../status/FirestoreConnectionSuccess';
import {
  ShoppingCart,
  Package,
  Clock,
  Store,
  CreditCard,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motion } from 'framer-motion';
import { ParallaxWrapper } from '../layout/ParallaxWrapper';
import { AnimatedCounter } from '../ui/AnimatedCounter';

interface RetailerStats {
  totalPurchases: number;
  pendingOrders: number;
  thisMonthSpent: number;
  favoriteSuppliers: number;
  averageOrderValue: number;
  successfulDeliveries: number;
}

// Embedded fallback data
const mockRetailerStats: RetailerStats = {
  totalPurchases: 234,
  pendingOrders: 12,
  thisMonthSpent: 450000,
  favoriteSuppliers: 8,
  averageOrderValue: 18500,
  successfulDeliveries: 98
};

const mockRecentOrders = [
  {
    id: "ORD-1234",
    items: "Cotton Blend Fabrics (Mixed Colors)",
    supplier: "Gujarat Cotton Mills",
    amount: 15600,
    quantity: "800m",
    status: "delivered",
    date: "2024-03-15"
  },
  {
    id: "ORD-1235",
    items: "Silk Scarves Collection",
    supplier: "Bangalore Silk House",
    amount: 8400,
    quantity: "50 pieces",
    status: "in_transit",
    date: "2024-03-18"
  },
  {
    id: "ORD-1236",
    items: "Denim Fabric Rolls",
    supplier: "Ahmedabad Denim Co.",
    amount: 22300,
    quantity: "600m",
    status: "processing",
    date: "2024-03-20"
  }
];

export function RetailerDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>(mockRecentOrders);

  useEffect(() => {
    if (!user?.email || !firebaseDb) return;

    const ordersRef = collection(firebaseDb, 'orders');
    const qOrders = query(ordersRef, where('buyerId', '==', user.email));

    const unsubscribe = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        const firstItem = data.items?.[0];
        return {
          id: doc.id,
          items: firstItem?.product_name || 'Multiple Items',
          supplier: 'Supplier via Calico', // or get from seller names later
          amount: data.total || 0,
          quantity: data.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0,
          status: data.status || 'pending',
          date: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      // Sort desc by date
      fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (fetchedOrders.length > 0) {
        setRecentOrders(fetchedOrders);
      }
    }, (error) => {
      console.error("Error fetching recent orders:", error);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { label: 'Delivered', variant: 'default' as const, color: 'text-green-600' },
      in_transit: { label: 'In Transit', variant: 'secondary' as const, color: 'text-blue-600' },
      processing: { label: 'Processing', variant: 'outline' as const, color: 'text-yellow-600' },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen relative overflow-hidden bg-slate-50/50"
    >
      {/* Mobile-optimized main container */}
      <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-8 md:space-y-10">

        {/* Firebase Connection Status */}
        <div className="px-1">
          <FirestoreConnectionSuccess />
          <CORSErrorsNotice />
        </div>

        {/* Hero Parallax Section - Mobile friendly heights */}
        <ParallaxWrapper
          backgroundImageUrl="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2670&auto=format&fit=crop"
          height="35vh"
          className="rounded-2xl mb-8 border border-white/20 shadow-2xl mt-4 sm:mt-0 mx-1 sm:mx-0"
          overlayOpacity={0}
          scrimGradient="linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)"
        >
          <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 pt-6 sm:pt-10 px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-white drop-shadow-sm overflow-hidden pt-2">
              <div className="mask-text-up">
                <span>
                  Retailer <span className="text-white italic">Hub</span>
                </span>
              </div>
            </h1>
            <p className="text-white max-w-2xl text-sm sm:text-lg font-light">
              Curate your collection and monitor the latest market trends.
            </p>
            {user && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <div className="glass-panel px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-2 border-white/20 text-white shadow-lg">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 text-accent-gold-light" />
                  <span className="font-semibold text-sm sm:text-base tracking-wide">{user.company}</span>
                </div>
              </div>
            )}
          </div>
        </ParallaxWrapper>        {/* Quick Deals & Market Insights - Premium Editorial Design */}
        <section className="space-y-6 sm:space-y-8">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Quick Deals & Insights
            </h2>
            <p className="text-sm text-muted-foreground font-light pl-4">
              Special offers curated for your retail business
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Flash Deal Card - Editorial Style */}
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut" }}>
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group flex flex-col h-full">
                <div className="relative h-40 sm:h-48 bg-stone-100 overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1601241773118-9e67091e199e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBmYWJyaWMlMjBibGVuZCUyMHRleHRpbGV8ZW58MXx8fHwxNzU5OTE2NTk3fDA&ixlib=rb-4.1.0&q=80&w=600"
                    alt="Cotton Fabric Blend"
                    className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-black text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-sm">
                      Flash Deal
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] font-bold bg-white/95 text-black uppercase tracking-wider px-2.5 py-1 rounded-sm border border-black/10">
                      18h left
                    </span>
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-grow justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight">
                      25% off Fast-Moving Cotton Blends
                    </h3>
                    <p className="text-sm text-muted-foreground font-light line-clamp-2">
                      High-turnover fabrics perfect for retail markets, blending comfort with durability.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-10 mt-auto"
                  >
                    View Catalog
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Market Insight Card - Editorial Style */}
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}>
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden group flex flex-col h-full">
                <div className="relative h-40 sm:h-48 bg-stone-100 overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758400311711-d7424c05b294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0ZXJuJTIwd2VhciUyMGRlbmltJTIwZmFzaGlvbnxlbnwxfHx8fDE3NTk5MTY1OTd8MA&ixlib=rb-4.1.0&q=80&w=600"
                    alt="Western Wear Denim Fashion"
                    className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-black text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-sm">
                      Market Insight
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] font-bold bg-white/95 text-black uppercase tracking-wider px-2.5 py-1 rounded-sm border border-black/10 inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Trending
                    </span>
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-grow justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight">
                      Western Wear Surge 60%
                    </h3>
                    <p className="text-sm text-muted-foreground font-light line-clamp-2">
                      Denim and jersey knits dominating retail markets. Stock up now to meet demand.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-10 mt-auto"
                  >
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Personalized Recommendations - Editorial Layout */}
        <section className="space-y-6 sm:space-y-8">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Recommendations
            </h2>
            <p className="text-sm text-muted-foreground font-light pl-4">
              Curated based on your business preferences and market trends
            </p>
          </div>

          {/* Fabric Recommendations Grid - Editorial Style */}
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex">
                <Card className="bg-transparent border-0 rounded-none shadow-none group cursor-pointer w-full flex flex-col">
                  <div className="relative aspect-square sm:aspect-[4/5] w-full bg-stone-100 overflow-hidden mb-4 rounded-sm">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1633175118641-6001540f5dc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBqZXJzZXklMjBrbml0JTIwZmFicmljJTIwdGV4dHVyZXxlbnwxfHx8fDE3NTk5MTYyNDJ8MA&ixlib=rb-4.1.0&q=80&w=600"
                      alt="Cotton Jersey Knit Fabric"
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 text-black px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold">
                        Trending
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1 relative">
                      <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight group-hover:underline underline-offset-4 decoration-1">
                        Cotton Jersey Knits
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light line-clamp-1">
                        Perfect for quick retail sales
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 items-end pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-900">₹280/meter</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MOQ: 500m</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-8">
                        Quote
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }} className="flex">
                <Card className="bg-transparent border-0 rounded-none shadow-none group cursor-pointer w-full flex flex-col">
                  <div className="relative aspect-square sm:aspect-[4/5] w-full bg-stone-100 overflow-hidden mb-4 rounded-sm">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1729940351212-1765c00793b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9yYWwlMjBwcmludCUyMGNvdHRvbiUyMGZhYnJpY3xlbnwxfHx8fDE3NTk5MTYyNDJ8MA&ixlib=rb-4.1.0&q=80&w=600"
                      alt="Floral Print Cotton Fabric"
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 text-black px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border border-black/10">
                        Best Seller
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1 relative">
                      <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight group-hover:underline underline-offset-4 decoration-1">
                        Floral Print Cotton
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light line-clamp-1">
                        Fast-moving ethnic designs
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 items-end pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-900">₹150/meter</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MOQ: 1000m</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-8">
                        Quote
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }} className="flex">
                <Card className="bg-transparent border-0 rounded-none shadow-none group cursor-pointer w-full flex flex-col">
                  <div className="relative aspect-square sm:aspect-[4/5] w-full bg-stone-100 overflow-hidden mb-4 rounded-sm">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1645859610425-f0f4177df5f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGZhYnJpYyUyMHRleHR1cmUlMjBibHVlfGVufDF8fHx8MTc1OTkxNjI0Mnww&ixlib=rb-4.1.0&q=80&w=600"
                      alt="Denim Fabric Texture"
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-black text-white px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold">
                        Top Pick
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1 relative">
                      <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight group-hover:underline underline-offset-4 decoration-1">
                        Stretch Denim Variants
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light line-clamp-1">
                        Popular with college crowd
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 items-end pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-900">₹320/meter</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MOQ: 300m</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-8">
                        Quote
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }} className="flex">
                <Card className="bg-transparent border-0 rounded-none shadow-none group cursor-pointer w-full flex flex-col">
                  <div className="relative aspect-square sm:aspect-[4/5] w-full bg-stone-100 overflow-hidden mb-4 rounded-sm">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1591176134674-87e8f7c73ce9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXNjb3NlJTIwcmF5b24lMjBmYWJyaWMlMjBmbG93aW5nfGVufDF8fHx8MTc1OTkxNjI0M3ww&ixlib=rb-4.1.0&q=80&w=600"
                      alt="Viscose Rayon Fabric"
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 text-black px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold">
                        New Arrival
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1 relative">
                      <h3 className="font-heading text-lg sm:text-xl text-slate-900 leading-tight group-hover:underline underline-offset-4 decoration-1">
                        Viscose Rayon Summer
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light line-clamp-1">
                        Seasonal fashion favorite
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 items-end pt-2 border-t border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-900">₹180/meter</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MOQ: 800m</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-8">
                        Quote
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Heritage Collection - Editorial Layout */}
        <section className="space-y-6 sm:space-y-8">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h3 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Heritage Collection
            </h3>
            <p className="text-sm text-muted-foreground font-light pl-4">
              Authentic Indian textiles with traditional prints & patterns
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3">
            {/* Block Print Sarees - Editorial optimized */}
            <Card className="bg-transparent border-0 rounded-none shadow-none group cursor-pointer h-full flex flex-col">
              <div className="relative aspect-[4/5] sm:aspect-auto sm:h-80 w-full bg-stone-100 overflow-hidden mb-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1693987646600-c911a3f571b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBibG9jayUyMHByaW50JTIwZmFicmljJTIwdHJhZGl0aW9uYWx8ZW58MXx8fHwxNzU5OTE3Mzc1fDA&ixlib=rb-4.1.0&q=80&w=600"
                  alt="Traditional Block Print Sarees"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-black text-white px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold">
                    Block Print
                  </span>
                </div>
              </div>
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 relative">
                  <h3 className="font-heading text-xl sm:text-2xl text-slate-900 leading-tight group-hover:underline underline-offset-4 decoration-1">
                    Handblock Print Sarees
                  </h3>
                  <p className="text-sm text-muted-foreground font-light line-clamp-2">
                    Rajasthani & Gujarati traditional designs. Ethically sourced and handcrafted.
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 items-end pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">₹1,800-₹6,500</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jaipur Artisans</p>
                  </div>
                  <Button className="w-full rounded-sm bg-black hover:bg-black/90 text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-10">
                    View Collection
                  </Button>
                </div>
              </div>
            </Card>

            {/* Traditional Crafts Summary - Editorial banner */}
            <div className="lg:col-span-2 p-6 sm:p-8 md:p-12 bg-stone-50 border border-border flex flex-col justify-center h-full group transition-colors hover:bg-stone-100/50 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 h-full relative z-10 w-full">
                <div className="flex flex-col justify-center space-y-4 max-w-sm flex-1">
                  <h4 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-wide leading-tight">
                    Authentic <br /><span className="italic font-light text-slate-700">Indian Heritage</span>
                  </h4>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">
                    Supporting traditional artisans across India with sustainable sourcing practices and fair trade standards. Let's build a vibrant cultural tapestry.
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end justify-between h-full space-y-6 sm:space-y-8 text-sm text-muted-foreground w-full sm:w-auto mt-4 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3 sm:gap-4 w-full justify-start sm:min-w-32">
                    <span className="flex items-center gap-3 group-hover:text-slate-900 transition-colors text-slate-700">
                      <span className="uppercase tracking-widest text-[10px] sm:text-xs font-semibold">Block Print</span>
                      <span className="w-1.5 h-1.5 bg-stone-800 rounded-full"></span>
                    </span>
                    <span className="flex items-center gap-3 group-hover:text-slate-900 transition-colors text-slate-700">
                      <span className="uppercase tracking-widest text-[10px] sm:text-xs font-semibold">Bandhani</span>
                      <span className="w-1.5 h-1.5 bg-stone-500 rounded-full"></span>
                    </span>
                    <span className="flex items-center gap-3 group-hover:text-slate-900 transition-colors text-slate-700">
                      <span className="uppercase tracking-widest text-[10px] sm:text-xs font-semibold">Ajrakh</span>
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                    </span>
                  </div>

                  <Button variant="outline" className="rounded-sm border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-bold h-10 w-full sm:w-auto px-6">
                    Discover Crafts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active Secure Trade Orders - Escrow Timeline */}
        <section className="space-y-6 sm:space-y-8">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Active Secure Trade
            </h2>
            <p className="text-sm text-slate-600 font-light pl-4">Live tracking & escrow status for your bulk orders</p>
          </div>

          <Card className="p-6 sm:p-8 border-border rounded-sm shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
              <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-none uppercase tracking-widest text-[9px] font-bold">In Progress</Badge>
              <span className="text-xs text-slate-400 mt-2 font-mono">ORD-3948-BULK</span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
              <div className="space-y-4 md:w-1/3 pt-4 md:pt-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-heading text-slate-900">Premium Cotton Blends</h3>
                  <p className="text-sm text-slate-500">800 meters from Gujarat Cotton Mills</p>
                </div>

                <div className="p-4 bg-stone-50 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-black" />
                    <span className="font-semibold text-slate-900">QC Inspector:</span>
                    <span className="text-slate-600">VeriTextile Mumbai Hub</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-4 w-4 text-black" />
                    <span className="font-semibold text-slate-900">Total Value:</span>
                    <span className="text-slate-600">₹2,45,000</span>
                  </div>
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="md:w-2/3 relative pl-6 md:pl-0 pt-4 md:pt-0">
                <div className="absolute left-[35px] md:left-[11px] top-2 bottom-2 w-px bg-slate-200" />

                <div className="space-y-8 relative">
                  {/* Step 1: Paid */}
                  <div className="flex gap-6 items-start">
                    <div className="w-6 h-6 rounded-full bg-black shrink-0 flex items-center justify-center z-10 ring-4 ring-white">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Payment Secured</h4>
                      <p className="text-lg font-heading text-green-600 mt-1">Funds: Secured in Escrow.</p>
                      <p className="text-xs text-slate-500 mt-1">Status: Awaiting production completion.</p>
                    </div>
                  </div>

                  {/* Step 2: Shipping to QC */}
                  <div className="flex gap-6 items-start">
                    <div className="w-6 h-6 rounded-full bg-black shrink-0 flex items-center justify-center z-10 ring-4 ring-white">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Manufacturer Dispatched</h4>
                      <p className="text-lg font-heading text-slate-900 mt-1">Location: In Transit to QC Hub (Mumbai).</p>
                      <p className="text-xs text-slate-500 mt-1">Expected arrival at inspector: Tomorrow, 2:00 PM</p>
                    </div>
                  </div>

                  {/* Step 3: QC Pending */}
                  <div className="flex gap-6 items-start opacity-40">
                    <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 flex items-center justify-center z-10 ring-4 ring-white" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Quality Inspection</h4>
                      <p className="text-lg font-heading text-slate-900 mt-1">Pending Approval</p>
                    </div>
                  </div>

                  {/* Step 4: Final Delivery */}
                  <div className="flex gap-6 items-start opacity-40">
                    <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 flex items-center justify-center z-10 ring-4 ring-white" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Final Delivery & Payout</h4>
                      <p className="text-lg font-heading text-slate-900 mt-1">Funds Released on Receipt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Recent Orders Summary - Editorial Style */}
        <section className="space-y-6 sm:space-y-8">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Recent Orders
            </h2>
            <p className="text-sm text-slate-600 font-light pl-4">Your latest purchase activity</p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {recentOrders.slice(0, 3).map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-4 sm:p-5 hover:bg-slate-50 transition-colors duration-300 group cursor-pointer border-border rounded-sm shadow-sm hover:shadow-md touch-manipulation">
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-2.5 rounded-full bg-stone-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 flex-shrink-0 mt-0.5 border border-border/50">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-medium text-xs sm:text-sm">{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{order.items}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">From: {order.supplier}</p>
                    </div>
                    <div className="text-right space-y-1 flex-shrink-0">
                      <div className="font-medium text-xs sm:text-sm">{formatCurrency(order.amount)}</div>
                      <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full rounded-sm border-black text-black hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] sm:text-xs font-bold h-12 flex items-center justify-center gap-2 group"
            onClick={() => onNavigate?.('orders')}
          >
            <span>View All Orders</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </section>



        {/* Performance Overview - Editorial Style */}
        <section className="space-y-6 sm:space-y-8 pb-12">
          <div className="space-y-2 px-1 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-heading text-slate-900 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-black rounded-full" />
              Performance Overview
            </h2>
            <p className="text-sm text-slate-600 font-light pl-4">Your business metrics at a glance</p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation group hover:border-black/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors tracking-wide">Total Purchases</CardTitle>
                  <Package className="h-4 w-4 text-slate-300 group-hover:text-black transition-colors" />
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="text-lg sm:text-2xl font-bold">
                    <AnimatedCounter value={mockRetailerStats.totalPurchases} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation group hover:border-black/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors tracking-wide">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-slate-300 group-hover:text-black transition-colors" />
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="text-lg sm:text-2xl font-bold">
                    <AnimatedCounter value={mockRetailerStats.pendingOrders} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expected delivery in 3-7 days
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -2 }}
            >
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation group hover:border-black/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors tracking-wide">This Month Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-slate-300 group-hover:text-black transition-colors" />
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="text-lg sm:text-2xl font-bold">
                    <AnimatedCounter value={mockRetailerStats.thisMonthSpent} formatCurrency={true} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +15% from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -2 }}
            >
              <Card className="bg-white border-border rounded-sm shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation group hover:border-black/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors tracking-wide">Avg Order Value</CardTitle>
                  <BarChart3 className="h-4 w-4 text-slate-300 group-hover:text-black transition-colors" />
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="text-lg sm:text-2xl font-bold">
                    <AnimatedCounter value={mockRetailerStats.averageOrderValue} formatCurrency={true} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Mobile spacing adjustment */}
        <div className="pb-4 sm:pb-6"></div>

      </div>
    </motion.div>
  );
}
