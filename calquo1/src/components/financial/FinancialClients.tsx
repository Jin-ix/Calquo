import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye } from 'lucide-react';
import { BackButton } from '../layout/BackButton';

// Mock data
const mockClientPortfolio = [
  {
    clientName: 'Fashion Hub Retailers',
    totalCredit: 500000,
    utilizedCredit: 320000,
    paymentHistory: 'Excellent',
    riskScore: 'A+',
    lastTransaction: '2024-01-20'
  },
  {
    clientName: 'Textile Traders Corp',
    totalCredit: 750000,
    utilizedCredit: 450000,
    paymentHistory: 'Good',
    riskScore: 'A',
    lastTransaction: '2024-01-18'
  }
];

interface FinancialClientsProps {
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export function FinancialClients({ onNavigateBack, onNavigateHome }: FinancialClientsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <BackButton 
          onBack={onNavigateBack} 
          onHome={onNavigateHome}
          label="Back"
        />
        <h1 className="text-2xl font-bold">Client Portfolio</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Monitor client financial health and credit status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockClientPortfolio.map((client) => (
              <div key={client.clientName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{client.clientName}</h3>
                    <p className="text-muted-foreground">Risk Score: {client.riskScore}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(client.totalCredit)}</div>
                    <Badge variant="outline" className="text-green-600">{client.paymentHistory}</Badge>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Total Credit Limit</p>
                    <p className="font-medium">{formatCurrency(client.totalCredit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Utilized Credit</p>
                    <p className="font-medium">{formatCurrency(client.utilizedCredit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Transaction</p>
                    <p className="font-medium">{formatDate(client.lastTransaction)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Credit Utilization</span>
                    <span className="text-sm font-medium">
                      {((client.utilizedCredit / client.totalCredit) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(client.utilizedCredit / client.totalCredit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    Credit Review
                  </Button>
                  <Button variant="outline" size="sm">
                    Transaction History
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
