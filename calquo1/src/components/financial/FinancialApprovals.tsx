import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { BackButton } from '../layout/BackButton';

// Mock data (in a real app, this might come from props or context)
const mockPendingTransactions = [
  {
    id: 'TXN-2024-001',
    clientName: 'Fashion Hub Retailers',
    amount: 150000,
    type: 'purchase_approval',
    requestDate: '2024-01-22',
    urgency: 'High',
    riskLevel: 'Low'
  },
  {
    id: 'TXN-2024-002',
    clientName: 'Textile Traders Corp',
    amount: 280000,
    type: 'credit_extension',
    requestDate: '2024-01-21',
    urgency: 'Medium',
    riskLevel: 'Medium'
  },
  {
    id: 'TXN-2024-003',
    clientName: 'Boutique Chain Network',
    amount: 75000,
    type: 'payment_verification',
    requestDate: '2024-01-20',
    urgency: 'Low',
    riskLevel: 'Low'
  }
];

interface FinancialApprovalsProps {
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export function FinancialApprovals({ onNavigateBack, onNavigateHome }: FinancialApprovalsProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return <Badge variant="destructive">High Urgency</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline">Low Urgency</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium Risk</Badge>;
      case 'Low':
        return <Badge variant="outline" className="text-green-600">Low Risk</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
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
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approvals Queue</CardTitle>
          <CardDescription>Financial transactions awaiting your review and approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPendingTransactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{transaction.id}</span>
                    <Badge variant="secondary">{transaction.type.replace('_', ' ')}</Badge>
                    {getUrgencyBadge(transaction.urgency)}
                    {getRiskBadge(transaction.riskLevel)}
                  </div>
                  <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Client Name</p>
                    <p className="font-medium">{transaction.clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Request Date</p>
                    <p className="font-medium">{formatDate(transaction.requestDate)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="default" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Review Details
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
