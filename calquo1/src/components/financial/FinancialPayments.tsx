import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowUpRight, Download, Filter } from 'lucide-react';
import { BackButton } from '../layout/BackButton';

// Mock payments data
const mockPayments = [
  {
    id: 'PAY-2024-889',
    to: 'Arvind Limited',
    from: 'Fashion Hub Retailers',
    amount: 85000,
    status: 'completed',
    date: '2024-01-22',
    method: 'Bank Transfer'
  },
  {
    id: 'PAY-2024-890',
    to: 'Gujarat Denim Hub',
    from: 'Textile Traders Corp',
    amount: 120000,
    status: 'processing',
    date: '2024-01-22',
    method: 'UPI'
  },
  {
    id: 'PAY-2024-888',
    to: 'Mumbai Ethnic Wear',
    from: 'Boutique Chain Network',
    amount: 45000,
    status: 'completed',
    date: '2024-01-21',
    method: 'Credit Card'
  },
   {
    id: 'PAY-2024-887',
    to: 'Surat Textile House',
    from: 'Delhi Fashion Warehouse',
    amount: 210000,
    status: 'failed',
    date: '2024-01-20',
    method: 'Bank Transfer'
  }
];

interface FinancialPaymentsProps {
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export function FinancialPayments({ onNavigateBack, onNavigateHome }: FinancialPaymentsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton 
          onBack={onNavigateBack} 
          onHome={onNavigateHome}
          label="Back"
        />
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
            </Button>
            <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments & Transactions</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Volume (Today)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹2,05,000</div>
                <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Processing</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">14</div>
                <p className="text-xs text-muted-foreground">Transactions in progress</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>History of recent financial movements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-full">
                        <ArrowUpRight className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <p className="font-medium text-slate-900">{payment.to}</p>
                             <span className="text-xs text-slate-400">•</span>
                             <p className="text-xs text-slate-500">{payment.method}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">From: {payment.from} • {formatDate(payment.date)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                    <div className="mt-1">{getStatusBadge(payment.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
