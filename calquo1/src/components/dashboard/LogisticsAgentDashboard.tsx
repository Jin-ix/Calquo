import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent 
} from '../ui/card';
import { useAuth } from '../auth/AuthProvider';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { NewPickupsPage } from '../logistics/NewPickupsPage';
import { TodaysPickupsPage } from '../logistics/TodaysPickupsPage';
import { InTransitPage } from '../logistics/InTransitPage';
import { ApprovalPanel } from '../purchase/ApprovalPanel';
import { UnifiedOrderManagement } from '../orders/UnifiedOrderManagement';

interface Order {
  id: string;
  status: string;
  updatedAt: string;
  logisticsAgentGst?: string;
}

interface LogisticsAgentDashboardProps {
  view?: string;
  onNavigate?: (view: string) => void;
}

export function LogisticsAgentDashboard({ view = 'home', onNavigate }: LogisticsAgentDashboardProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Debug view changes
  useEffect(() => {
    console.log('🔄 LogisticsAgentDashboard: View changed to:', view);
  }, [view]);
  
  // Map 'home' to 'dashboard' for internal logic if needed, or just use 'home'
  // But my pages use 'new', 'today', 'transit'.
  // If view is 'home', show dashboard.
  const isDashboard = view === 'home' || view === 'dashboard';

  // Pastel Orange Theme Constants
  const THEME_COLOR = '#FF8C42';
  const THEME_BG = '#FFF0E6';

  useEffect(() => {
    if (!user?.profile?.gstNumber || !firebaseDb) return;

    const q = query(
      collection(firebaseDb, 'orders'),
      where('logisticsAgentGst', '==', user.profile.gstNumber)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
    }, (error) => {
      console.error('Error fetching orders:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter Counts
  const newPickupsCount = orders.filter(o => o.status === 'confirmed').length;
  const todaysPickupsCount = orders.filter(o => o.status === 'pickup_scheduled').length;
  const inTransitCount = orders.filter(o => o.status === 'picked_up').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered' && new Date(o.updatedAt).toDateString() === new Date().toDateString()).length;

  const handleNavigate = (target: string) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  const handleBack = () => handleNavigate('home');

  // View Routing
  if (view === 'new') return <NewPickupsPage onBack={handleBack} />;
  if (view === 'today') return <TodaysPickupsPage onBack={handleBack} />;
  if (view === 'transit') return <InTransitPage onBack={handleBack} />;
  if (view === 'approvals') return <UnifiedOrderManagement key="approvals" userRole="logistics_agent" />;
  if (view === 'orders') return <UnifiedOrderManagement key="orders" userRole="logistics_agent" />;

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_BG }}>
          <Truck className="h-6 w-6" style={{ color: THEME_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
          <p className="text-sm text-gray-500">Overview</p>
        </div>
      </div>

      {/* Navigation Cards (Menu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Pending Approvals Card - NEW */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('approvals')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Pending Approvals</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">--</h3>
                <p className="text-xs text-gray-400 mt-1">Purchase Requests</p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <CheckCircle className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              Review & Approve <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>
        
        {/* New Requests Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('new')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">New Requests</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{newPickupsCount}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <Package className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              View Details <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Pickups Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('today')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Today's Pickups</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{todaysPickupsCount}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <Activity className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              View Schedule <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* In Transit Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('transit')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MapPin className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">In Transit</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{inTransitCount}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <MapPin className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              Track Orders <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* Delivered Today Card (Read Only) */}
        <Card className="border-none shadow-sm bg-gray-50 opacity-90">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Delivered Today</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{deliveredCount}</h3>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-400">
              Completed
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
