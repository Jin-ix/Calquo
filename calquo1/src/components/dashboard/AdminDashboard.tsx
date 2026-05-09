import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  Settings, 
  Database, 
  Activity, 
  TrendingUp, 
  Building2, 
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Wallet // Added Wallet icon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useAuth } from '../auth/AuthProvider';

// Contexts
import { useOrders } from '../context/OrderProvider';
import { useStock } from '../context/StockContext';

// Admin Components
import { UserManagement, CompanyUser } from '../admin/UserManagement';
import { AdminOrdersManagement } from '../orders/AdminOrdersManagement';
import { OrderRequest } from '../orders/OrderDialog';
import { SuppliersManager } from '../admin/SuppliersManager';
import { LogisticsAgentManager } from '../logistics/LogisticsAgentManager';
import { CityManager } from '../logistics/CityManager';
import { LogisticsAgent, DeliveryCity } from '../logistics/LogisticsTypes';
import { LogisticsDebugger } from '../logistics/LogisticsDebugger';
import { TrendingItemsManager } from '../admin/TrendingItemsManager';
import { FinancialAgentManager } from '../financial/FinancialAgentManager';
import { StockManagementHub } from '../stock/StockManagementHub';
import { StockItem } from '../stock/StockCard';

// Fixed Imports
import { FirebaseConfigChecker } from '../admin/FirebaseConfigChecker';
import { DatabaseCleanup } from '../admin/DatabaseCleanup';
import { SystemHealthSummary } from '../admin/SystemHealthSummary';
import { DatabaseSetupChecker } from '../admin/DatabaseSetupChecker';
import { listenToCollection } from '../../utils/firebase/firestore';

interface AdminDashboardProps {
  orders?: OrderRequest[];
  onUpdateOrderStatus?: (orderId: string, status: OrderRequest['status'], adminRemarks?: string) => void;
  stocks?: StockItem[];
  onUpdateTrending?: (stockId: string, isTrending: boolean, trendingText?: string) => void;
  logisticsAgents?: LogisticsAgent[];
  cities?: DeliveryCity[];
  onAddLogisticsAgent?: (agent: Omit<LogisticsAgent, 'id' | 'dateAdded' | 'isActive'>) => void;
  onUpdateLogisticsAgent?: (agentId: string, updates: Partial<LogisticsAgent>) => void;
  onDeleteLogisticsAgent?: (agentId: string) => void;
  onAddCity?: (city: Omit<DeliveryCity, 'id' | 'dateAdded'>) => void;
  onUpdateCity?: (cityId: string, updates: Partial<DeliveryCity>) => void;
  onDeleteCity?: (cityId: string) => void;
  onUserUpdate?: (users: CompanyUser[]) => void;
  initialTab?: string;
}

export function AdminDashboard({ 
  orders: propOrders = [], 
  onUpdateOrderStatus, 
  stocks: propStocks = [], 
  onUpdateTrending,
  logisticsAgents = [],
  cities = [],
  onAddLogisticsAgent,
  onUpdateLogisticsAgent,
  onDeleteLogisticsAgent,
  onAddCity,
  onUpdateCity,
  onDeleteCity,
  onUserUpdate,
  initialTab = 'overview'
}: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Local state for fetched data
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [logisticsAgentsState, setLogisticsAgentsState] = useState<LogisticsAgent[]>([]);
  const [citiesState, setCitiesState] = useState<DeliveryCity[]>([]);

  // Integrate Contexts for robust data handling
  const { orders: contextOrders, updateOrderStatus: contextUpdateStatus } = useOrders();
  const { allStock: contextStocks, updateStock } = useStock();

  // Use Context data as primary source, falling back to props only if context is empty and props are provided
  // This prioritizes the live Firestore data from context
  const orders = contextOrders.length > 0 ? contextOrders : propOrders;
  const stocks = (contextStocks.length > 0 ? contextStocks : propStocks) as unknown as StockItem[];
  
  // Derive logistics agents from Users who have the role (Sync with Company Users)
  // Matches "logistics", "logistics agent", "transport" (case-insensitive)
  const logisticsUserAgents: LogisticsAgent[] = users
    .filter(u => {
      const role = (u.business_role || '').toLowerCase().trim();
      return role.includes('logistics') || role.includes('transport');
    })
    .map(u => ({
      id: u.id,
      name: u.company_name || u.owner_name,
      gstNumber: u.gst_number,
      mobileNumber: u.mobile,
      serviceArea: { type: 'all-india' }, // Default for converted users
      isActive: u.status === 'active',
      dateAdded: u.createdAt || new Date().toISOString(),
      totalDeliveries: 0,
      specialServices: []
    }));

  // Combine with Firestore 'logistics_agents' collection data
  // Prefer explicit logistics_agents collection entries if duplicates exist
  const combinedLogisticsAgents = [...logisticsAgentsState];
  
  logisticsUserAgents.forEach(agent => {
    // Avoid duplicates: check ID and GST
    const exists = combinedLogisticsAgents.some(a => a.id === agent.id || (a.gstNumber && a.gstNumber === agent.gstNumber));
    if (!exists) {
      combinedLogisticsAgents.push(agent);
    }
  });

  const effectiveLogisticsAgents = logisticsAgents.length > 0 ? logisticsAgents : combinedLogisticsAgents;
  const effectiveCities = cities.length > 0 ? cities : citiesState;

  // Real-time data listeners
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super-admin') return;

    // 1. Listen to Logistics Agents
    const unsubAgents = listenToCollection('logistics_agents', [], (data) => {
      setLogisticsAgentsState(data as LogisticsAgent[]);
    });

    // 2. Listen to Delivery Cities
    const unsubCities = listenToCollection('delivery_cities', [], (data) => {
      setCitiesState(data as DeliveryCity[]);
    });

    // 3. Listen to Companies (Users)
    // This ensures we have the user count for the dashboard overview
    const unsubUsers = listenToCollection('companies', [], (data) => {
      const mappedUsers = data.map(doc => ({
        id: doc.id,
        ...doc,
        // Ensure essential fields exist
        business_role: doc.role || doc.business_role || 'retailer',
        company_name: doc.company_name || 'Unknown Company',
        owner_name: doc.owner_name || 'Unknown Owner',
        email: doc.email || '',
        mobile: doc.mobile || doc.mobile_number || '',
        gst_number: doc.gst_number || doc.id,
        status: doc.status || (doc.is_verified ? 'active' : 'pending')
      })) as CompanyUser[];
      
      setUsers(mappedUsers);
      onUserUpdate?.(mappedUsers);
    });

    return () => {
      unsubAgents();
      unsubCities();
      unsubUsers();
    };
  }, [user, onUserUpdate]);

  // Handlers using Context if props not provided
  const handleUpdateOrderStatus = onUpdateOrderStatus || contextUpdateStatus;
  
  const handleUpdateTrending = onUpdateTrending || ((stockId: string, isTrending: boolean, trendingText?: string) => {
     updateStock(stockId, { isTrending, trendingText });
  });

  // Handler for UserManagement component updates (although we also fetch independently)
  const handleUserUpdate = (updatedUsers: CompanyUser[]) => {
    setUsers(updatedUsers);
    onUserUpdate?.(updatedUsers);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'products', label: 'Product Inventory', icon: Package },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart },
    { id: 'suppliers', label: 'Supplier Database', icon: Building2 },
    { id: 'financial', label: 'Financial Agents', icon: Wallet },
    { id: 'logistics', label: 'Logistics & Cities', icon: Truck },
    { id: 'content', label: 'Trending & Content', icon: TrendingUp },
    ...(user?.role === 'super-admin' ? [{ id: 'system', label: 'System Controls', icon: Settings }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-white shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            {user?.role === 'super-admin' ? 'Super Admin' : 'Admin Panel'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {user?.role === 'super-admin' ? 'Full System Access' : 'System Management'}
          </p>
        </div>
        
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeTab === item.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50/50">
          <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-40">
           <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" /> {user?.role === 'super-admin' ? 'Super Admin' : 'Admin Panel'}
           </div>
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button>
             </SheetTrigger>
             <SheetContent side="left" className="w-64 p-0">
                <div className="p-6 border-b">
                   <h2 className="font-bold text-lg">Menu</h2>
                </div>
                <div className="py-4 space-y-1">
                   {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "secondary" : "ghost"}
                        className="w-full justify-start rounded-none px-6"
                        onClick={() => setActiveTab(item.id)}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Button>
                   ))}
                </div>
             </SheetContent>
           </Sheet>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
           {/* Header Area */}
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-2xl font-bold tracking-tight">{navItems.find(i => i.id === activeTab)?.label}</h2>
                 <p className="text-muted-foreground">
                    {activeTab === 'overview' && 'System status and key metrics overview.'}
                    {activeTab === 'users' && 'Manage registered users, roles, and permissions.'}
                    {activeTab === 'products' && 'Full inventory control across all suppliers.'}
                    {activeTab === 'orders' && 'Process, track, and manage all system orders.'}
                    {activeTab === 'suppliers' && 'Manage supplier profiles and verifications.'}
                    {activeTab === 'financial' && 'Manage financial partners and credit services.'}
                    {activeTab === 'logistics' && 'Configure logistics partners and delivery cities.'}
                    {activeTab === 'content' && 'Manage trending items and featured content.'}
                    {activeTab === 'system' && 'Database maintenance and system configuration.'}
                 </p>
              </div>
           </div>

           {/* Content Area */}
           <div className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
              
              {/* 1. OVERVIEW */}
              {activeTab === 'overview' && (
                 <div className="space-y-6">
                    <SystemHealthSummary />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                       <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                             <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                             <div className="text-2xl font-bold">{users.length}</div>
                             <p className="text-xs text-muted-foreground">Registered accounts</p>
                          </CardContent>
                       </Card>
                       <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                             <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                             <div className="text-2xl font-bold">{orders.length}</div>
                             <p className="text-xs text-muted-foreground">All time orders</p>
                          </CardContent>
                       </Card>
                       <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Active Stock</CardTitle>
                             <Package className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                             <div className="text-2xl font-bold">{stocks.length}</div>
                             <p className="text-xs text-muted-foreground">Across all suppliers</p>
                          </CardContent>
                       </Card>
                       <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">System Health</CardTitle>
                             <Activity className="h-4 w-4 text-green-500" />
                          </CardHeader>
                          <CardContent>
                             <div className="text-2xl font-bold text-green-600">Good</div>
                             <p className="text-xs text-muted-foreground">Operational</p>
                          </CardContent>
                       </Card>
                    </div>
                    <Card>
                       <CardHeader>
                          <CardTitle>Quick System Check</CardTitle>
                          <CardDescription>Firebase connectivity status</CardDescription>
                       </CardHeader>
                       <CardContent>
                          <FirebaseConfigChecker />
                       </CardContent>
                    </Card>
                 </div>
              )}

              {/* 2. USERS */}
              {activeTab === 'users' && (
                 <UserManagement onUserUpdate={handleUserUpdate} />
              )}

              {/* 3. PRODUCTS */}
              {activeTab === 'products' && (
                 <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0">
                       <StockManagementHub />
                    </CardContent>
                 </Card>
              )}

              {/* 4. ORDERS */}
              {activeTab === 'orders' && (
                 <AdminOrdersManagement 
                    orders={orders} 
                    onUpdateOrderStatus={handleUpdateOrderStatus} 
                 />
              )}

              {/* 5. SUPPLIERS */}
              {activeTab === 'suppliers' && (
                 <SuppliersManager users={users} />
              )}

              {/* 6. FINANCIAL AGENTS */}
              {activeTab === 'financial' && (
                 <FinancialAgentManager users={users} />
              )}

              {/* 7. LOGISTICS */}
              {activeTab === 'logistics' && (
                 <Tabs defaultValue="agents" className="w-full">
                    <TabsList>
                       <TabsTrigger value="agents">Logistics Agents</TabsTrigger>
                       <TabsTrigger value="cities">Delivery Cities</TabsTrigger>
                       <TabsTrigger value="debug">🔧 Debug</TabsTrigger>
                    </TabsList>
                    <TabsContent value="agents" className="mt-4">
                       <LogisticsAgentManager 
                          agents={effectiveLogisticsAgents}
                          cities={effectiveCities}
                          users={users} // Pass live users list
                          onAddAgent={onAddLogisticsAgent || (() => {})}
                          onUpdateAgent={onUpdateLogisticsAgent || (() => {})}
                          onDeleteAgent={onDeleteLogisticsAgent || (() => {})}
                       />
                    </TabsContent>
                    <TabsContent value="cities" className="mt-4">
                       <CityManager 
                          cities={effectiveCities}
                          onAddCity={onAddCity || (() => {})}
                          onUpdateCity={onUpdateCity || (() => {})}
                          onDeleteCity={onDeleteCity || (() => {})}
                       />
                    </TabsContent>
                    <TabsContent value="debug" className="mt-4">
                       <LogisticsDebugger />
                    </TabsContent>
                 </Tabs>
              )}

              {/* 7. CONTENT */}
              {activeTab === 'content' && (
                 <TrendingItemsManager 
                    stocks={stocks}
                    onUpdateTrending={handleUpdateTrending}
                 />
              )}

              {/* 8. SYSTEM */}
              {activeTab === 'system' && (
                 <div className="grid gap-6">
                    <Card>
                       <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                             <Database className="h-5 w-5" /> Database Maintenance
                          </CardTitle>
                          <CardDescription>Tools to clean up and verify database integrity</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-4">
                          <DatabaseCleanup />
                          <div className="my-4 border-t" />
                          <DatabaseSetupChecker />
                       </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                           <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <FirebaseConfigChecker />
                        </CardContent>
                    </Card>
                 </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
}
