import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Target,
  PieChart,
  LineChart,
  Activity,
  ArrowUpRight,
  Download,
  RefreshCw,
  Zap,
  Building
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

// Mock analytics data - in a real app this would come from API
const mockAnalyticsData = {
  salesTrend: [
    { month: 'Jan', sales: 120000, orders: 145 },
    { month: 'Feb', sales: 135000, orders: 162 },
    { month: 'Mar', sales: 158000, orders: 189 },
    { month: 'Apr', sales: 142000, orders: 167 },
    { month: 'May', sales: 175000, orders: 203 },
    { month: 'Jun', sales: 198000, orders: 231 }
  ],
  productCategories: [
    { name: 'T-Shirts', value: 35 },
    { name: 'Shirts', value: 25 },
    { name: 'Jeans', value: 20 },
    { name: 'Dresses', value: 12 },
    { name: 'Others', value: 8 }
  ],
  topProducts: [
    { name: 'Premium Cotton T-Shirt', sales: 1250, revenue: 243750, growth: 12 },
    { name: 'Corporate Formal Shirt', sales: 980, revenue: 377300, growth: 8 },
    { name: 'Designer Kurti Collection', sales: 750, revenue: 521250, growth: 15 },
    { name: 'Premium Denim Jeans', sales: 650, revenue: 581750, growth: 5 },
    { name: 'Winter Blazer Collection', sales: 420, revenue: 669900, growth: 22 }
  ]
};

// Premium monochrome color palette for charts
const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-black/10 p-4 shadow-xl rounded-sm">
        <p className="font-heading font-semibold text-lg mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground uppercase tracking-wider text-[0.65rem]">
                {entry.name}:
              </span>
              <span className="font-bold">
                {entry.name === 'sales' ? `₹${entry.value.toLocaleString()}` : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-7xl mx-auto w-full px-4 py-8 md:p-8 space-y-10 bg-[#FAFAFA] min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-black/5 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Comprehensive business insights and performance metrics
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded-sm w-fit border border-black/5 shadow-sm">
            <Building className="h-3.5 w-3.5 text-slate-700" />
            <span className="font-medium text-slate-900">{user.company}</span>
            <span className="text-[0.65rem] px-2 py-0.5 uppercase tracking-[0.05em] bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
              {user.role} Account
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-sm border-black/10 hover:bg-slate-50 transition-all font-medium text-xs tracking-wide uppercase"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            className="rounded-sm bg-slate-900 text-white hover:bg-slate-800 transition-all font-medium text-xs tracking-wide uppercase"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: "₹1,28,50,000", change: "+12.5%", icon: DollarSign, trend: "up" },
          { title: "Total Orders", value: "1,097", change: "+8.2%", icon: ShoppingCart, trend: "up" },
          { title: "Avg Order Value", value: "₹11,720", change: "+3.8%", icon: Target, trend: "up" },
          { title: "Customer Growth", value: "156", change: "+15.3%", icon: Users, trend: "up" }
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[0.65rem] uppercase tracking-[0.05em] font-medium text-slate-500">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-slate-900 tracking-tight mt-1">{metric.value}</div>
                <div className="flex items-center text-xs mt-3">
                  <span className="flex items-center text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {metric.change}
                  </span>
                  <span className="text-slate-400 ml-2">from last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Tabs - Premium Styling */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-black/5 rounded-none bg-transparent h-auto p-0 space-x-8 mb-8">
          {['overview', 'sales', 'products', 'insights'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-900 px-0 py-3 text-xs uppercase tracking-[0.05em] font-medium text-slate-500 hover:text-slate-700 transition-all"
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'sales' && 'Sales Trends'}
              {tab === 'products' && 'Products'}
              {tab === 'insights' && 'Insights'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="lg:col-span-2 bg-white border border-[#E5E7EB] shadow-none rounded-sm">
              <CardHeader className="border-b border-black/5 pb-4">
                <CardTitle className="flex items-center gap-2 font-heading text-xl">
                  <LineChart className="h-5 w-5 text-slate-400" />
                  Sales & Orders Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsLineChart data={mockAnalyticsData.salesTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value / 1000}k`}
                      dx={-10}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dx={10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#94a3b8"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Categories Distribution */}
            <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm">
              <CardHeader className="border-b border-black/5 pb-4">
                <CardTitle className="flex items-center gap-2 font-heading text-xl">
                  <PieChart className="h-5 w-5 text-slate-400" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={240}>
                  <RechartsPieChart>
                    <Pie
                      data={mockAnalyticsData.productCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockAnalyticsData.productCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className="mt-4 space-y-2">
                  {mockAnalyticsData.productCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-600">{category.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{category.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm">
            <CardHeader className="border-b border-black/5 pb-4">
              <CardTitle className="flex items-center gap-2 font-heading text-xl">
                <BarChart3 className="h-5 w-5 text-slate-400" />
                Monthly Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RechartsBarChart data={mockAnalyticsData.salesTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="sales" fill="#0f172a" radius={[2, 2, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm overflow-hidden">
            <CardHeader className="border-b border-black/5 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 font-heading text-xl">
                <Package className="h-5 w-5 text-slate-400" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-black/5">
                {mockAnalyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-6 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-slate-100 rounded-sm border border-slate-200 flex items-center justify-center font-heading font-bold text-slate-900 text-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">{product.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{product.sales.toLocaleString()} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-lg tracking-tight">₹{product.revenue.toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        <p className="text-xs font-medium text-emerald-600">+{product.growth}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm">
              <CardHeader className="border-b border-black/5 pb-4">
                <CardTitle className="flex items-center gap-2 font-heading text-xl">
                  <Zap className="h-5 w-5 text-slate-400" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {[
                    { title: "Peak Sales Period", desc: "May showed 15% higher sales compared to average", color: "bg-slate-900" },
                    { title: "Top Category Growth", desc: "T-Shirts category leads with 35% market share", color: "bg-slate-700" },
                    { title: "Customer Retention", desc: "85% repeat purchase rate this quarter", color: "bg-slate-500" }
                  ].map((insight, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${insight.color} mt-2 ring-4 ring-slate-50`} />
                      <div>
                        <p className="font-semibold text-slate-900">{insight.title}</p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{insight.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[#E5E7EB] shadow-none rounded-sm">
              <CardHeader className="border-b border-black/5 pb-4">
                <CardTitle className="flex items-center gap-2 font-heading text-xl">
                  <Activity className="h-5 w-5 text-slate-400" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {[
                    { label: "Conversion Rate", value: "12.8%", accent: "text-slate-900" },
                    { label: "Customer Satisfaction", value: "4.8/5", accent: "text-slate-900" },
                    { label: "Order Fulfillment Time", value: "2.4 days", accent: "text-slate-900" },
                    { label: "Return Rate", value: "1.2%", accent: "text-emerald-600" }
                  ].map((metric, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{metric.label}</span>
                      <span className={`font-heading font-bold text-lg ${metric.accent}`}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
