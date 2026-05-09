import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthProvider';
import { CheckCircle, XCircle, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';

interface FinancialApprovalsProps {
  onBack: () => void;
}

export function FinancialApprovals({ onBack }: FinancialApprovalsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch pending orders/transactions from Firestore
  useEffect(() => {
    let unsubscribe = () => {};

    const fetchPendingTransactions = async () => {
      try {
        const { firebaseDb, isFirebaseDemoMode } = await import('../../utils/firebase/config');
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');

        if (isFirebaseDemoMode || !firebaseDb) {
           console.log('Firebase not connected or in demo mode');
           setTransactions([]);
           setLoading(false);
           return;
        }

        // Query for orders that need payment verification or approval
        // paymentStatus: 'pending' or 'payment_required'
        let constraints = [
          where('paymentStatus', 'in', ['pending', 'payment_required'])
        ];

        // Filter by financial agent if user is a financial agent
        if (user?.role === 'financial' && user?.id) {
          constraints.push(where('financialAgentId', '==', user.id));
        }

        const q = query(
            collection(firebaseDb, 'orders'),
            ...constraints
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
           const fetchedTransactions = snapshot.docs.map(doc => {
              const data = doc.data();
              // Map order data to transaction format
              return {
                id: doc.id,
                clientName: data.buyerCompany || 'Unknown Client',
                amount: data.totalAmount || 0,
                type: data.paymentStatus === 'payment_required' ? 'payment_verification' : 'purchase_approval',
                requestDate: data.orderDate || new Date().toISOString(),
                urgency: data.totalAmount > 100000 ? 'High' : 'Medium', // Simple logic for urgency
                riskLevel: 'Low' // Placeholder logic
              };
           });
           
           setTransactions(fetchedTransactions);
           setLoading(false);
        }, (error) => {
           console.error("Error listening to pending transactions:", error);
           setTransactions([]);
           setLoading(false);
        });

      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
        setLoading(false);
      }
    };

    fetchPendingTransactions();

    return () => unsubscribe();
  }, [user]);

  const filteredTransactions = transactions.filter(t => 
    t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500">Manage pending financial requests</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="search"
          placeholder="Search transactions..."
          className="md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No pending approvals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id.slice(0, 8)}</TableCell>
                      <TableCell>{transaction.clientName}</TableCell>
                      <TableCell>
                         <Badge variant="outline">{transaction.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(transaction.requestDate)}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>{getUrgencyBadge(transaction.urgency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0" title="Approve">
                             <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 w-8 p-0" title="Reject">
                             <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="View">
                             <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
