import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Users
} from 'lucide-react';

// Import the new role-specific dashboards
import { AdminDashboard } from './AdminDashboard'; // Integrated new Admin Dashboard
import { RetailerDashboard } from './RetailerDashboard';
import { ManufacturerDashboard } from './ManufacturerDashboard';
import { TraderDashboard } from './TraderDashboard';
import { FinancialAgentDashboard } from './FinancialAgentDashboard';
import { LogisticsAgentDashboard } from './LogisticsAgentDashboard';


// Mock data for Warehouse dashboard (others use real components)
const mockData = {
  warehouse: {
    totalStock: 8950,
    activeOrders: 45,
    revenue: 180000,
    suppliers: 23
  }
};

export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Render Admin Dashboard directly - it has its own layout
  if (user.role === 'admin' || user.role === 'super-admin') {
    return <AdminDashboard />;
  }

  const renderWarehouseDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockData.warehouse.totalStock.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-blue-600">+6%</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockData.warehouse.activeOrders}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+3</span> from yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{mockData.warehouse.revenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+18%</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockData.warehouse.suppliers}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+2</span> new partnerships
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'manufacturer':
        return <ManufacturerDashboard />;
      case 'warehouse':
        return renderWarehouseDashboard();
      case 'retailer':
        return <RetailerDashboard />;
      case 'trader':
        return <TraderDashboard />;
      case 'financial':
        return <FinancialAgentDashboard />;
      case 'logistics-agent':
        return <LogisticsAgentDashboard />;
      default:
        return <div>Dashboard not available for this role</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! Here's your {user.role} overview.
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </div>

      {renderDashboardContent()}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Use the sidebar navigation to access all features for your role.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
