import React from 'react';
import { 
  Card, 
  CardContent 
} from '../ui/card';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { 
  CreditCard, 
  Users, 
  FileText, 
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { ApprovalPanel } from '../purchase/ApprovalPanel';

interface FinancialStats {
  totalTransactions: number;
  pendingApprovals: number;
  monthlyVolume: number;
  approvedTransactions: number;
  rejectedTransactions: number;
  averageTransactionValue: number;
  activeClients: number;
}

// Embedded fallback data
const mockFinancialStats: FinancialStats = {
  totalTransactions: 456,
  pendingApprovals: 23,
  monthlyVolume: 2340000,
  approvedTransactions: 412,
  rejectedTransactions: 21,
  averageTransactionValue: 95000,
  activeClients: 42
};

interface FinancialAgentDashboardProps {
  onNavigate?: (page: string) => void;
  view?: string;
}

export function FinancialAgentDashboard({ onNavigate, view = 'home' }: FinancialAgentDashboardProps) {
  const { user } = useAuth();
  
  // Try to get orders, but use fallback data if not available
  let orders = [];
  let useOrderData = false;
  try {
    const { orders: contextOrders } = useOrders();
    orders = contextOrders || [];
    useOrderData = true;
  } catch (error) {
    console.warn('Orders context not available, using fallback data');
    useOrderData = false;
  }
  
  // Calculate statistics
  let pendingApprovalCount = mockFinancialStats.pendingApprovals;
  let clientCount = mockFinancialStats.activeClients;
  
  if (useOrderData && orders.length > 0) {
    const pendingOrders = orders.filter(order => 
      order.status === 'accepted' && 
      order.paymentStatus === 'payment_required'
    );
    pendingApprovalCount = pendingOrders.length;
    
    // Mock calculation for unique clients from orders
    const uniqueClients = new Set(orders.map(o => o.retailerId || o.shopName)).size;
    clientCount = uniqueClients || mockFinancialStats.activeClients;
  }

  // Theme Constants (Emerald Green for Financial)
  const THEME_COLOR = '#059669'; // Emerald 600
  const THEME_BG = '#ECFDF5';    // Emerald 50

  const handleNavigate = (target: string) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  // View Routing
  if (view === 'approvals') return <ApprovalPanel />;

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: THEME_BG }}>
          <Briefcase className="h-6 w-6" style={{ color: THEME_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-500">Overview</p>
        </div>
      </div>

      {/* Navigation Cards (Menu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approvals Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('approvals')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Pending Approvals</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{pendingApprovalCount}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <FileText className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              Review Requests <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('payments')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Payments</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{mockFinancialStats.totalTransactions}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <CreditCard className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              View Transactions <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* Clients Card */}
        <Card 
          className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
          onClick={() => handleNavigate('clients')}
        >
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-24 w-24" style={{ color: THEME_COLOR }} />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-500">Active Clients</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-900">{clientCount}</h3>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: THEME_BG }}>
                <Users className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: THEME_COLOR }}>
              Manage Portfolio <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
