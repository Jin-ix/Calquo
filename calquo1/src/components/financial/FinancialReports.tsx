import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BackButton } from '../layout/BackButton';
import { BarChart3, TrendingUp, PieChart, FileText, Download } from 'lucide-react';

interface FinancialReportsProps {
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export function FinancialReports({ onNavigateBack, onNavigateHome }: FinancialReportsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton 
          onBack={onNavigateBack} 
          onHome={onNavigateHome}
          label="Back"
        />
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All Data
        </Button>
      </div>

      <h1 className="text-2xl font-bold">Financial Analytics & Reports</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <CardTitle>Transaction Volume</CardTitle>
                </div>
                <CardDescription>Monthly transaction analysis</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Chart Visualization Placeholder</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Volume</p>
                        <p className="text-xl font-bold">{formatCurrency(2340000)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Growth</p>
                        <p className="text-xl font-bold text-green-600">+12.5%</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    <CardTitle>Risk Distribution</CardTitle>
                </div>
                <CardDescription>Client portfolio risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Chart Visualization Placeholder</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Low Risk</p>
                        <p className="text-xl font-bold">65%</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">High Risk</p>
                        <p className="text-xl font-bold text-red-600">5%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Download detailed financial statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
                { name: 'Monthly Transaction Summary', type: 'PDF', date: 'Jan 2024' },
                { name: 'Risk Assessment Report', type: 'Excel', date: 'Q4 2023' },
                { name: 'Client Credit Utilization', type: 'CSV', date: 'Jan 24, 2024' },
                { name: 'Tax Compliance Report', type: 'PDF', date: 'FY 2023-24' }
            ].map((report, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded">
                            <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-xs text-muted-foreground">{report.date} • {report.type}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
