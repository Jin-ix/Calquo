import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthProvider';
import { ArrowLeft, Download, ArrowUpRight, ArrowDownLeft, Calendar, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface FinancialPaymentsProps {
  onBack: () => void;
}

export function FinancialPayments({ onBack }: FinancialPaymentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchPayments = async () => {
      try {
        const { firebaseDb, isFirebaseDemoMode } = await import('../../utils/firebase/config');
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');

        if (isFirebaseDemoMode || !firebaseDb) {
           console.log('Firebase not connected or in demo mode');
           setPayments([]);
           setLoading(false);
           return;
        }

        let constraints = [
          where('paymentStatus', 'in', ['completed', 'paid', 'failed', 'processing'])
        ];

        if (user?.role === 'financial' && user?.id) {
          constraints.push(where('financialAgentId', '==', user.id));
        }

        const q = query(
            collection(firebaseDb, 'orders'),
            ...constraints
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
           const fetchedPayments = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: `PAY-${doc.id.split('-')[1] || doc.id.substring(0, 8)}`,
                entity: data.buyerCompany || 'Unknown Entity',
                amount: data.totalAmount || 0,
                status: data.paymentStatus === 'paid' ? 'completed' : data.paymentStatus,
                date: data.orderDate || new Date().toISOString(),
                type: 'incoming', // Simplified
                method: data.paymentMethod || 'Online'
              };
           });
           
           setPayments(fetchedPayments);
           setLoading(false);
        }, (error) => {
           console.error("Error listening to payments:", error);
           setPayments([]);
           setLoading(false);
        });

      } catch (error) {
        console.error("Error fetching payments:", error);
        setPayments([]);
        setLoading(false);
      }
    };

    fetchPayments();

    return () => unsubscribe();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Success</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPayments = payments
    .filter(p => filter === 'all' || p.type === filter)
    .filter(p => 
      p.entity.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Track and manage transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          type="search"
          placeholder="Search payments..."
          className="w-full md:w-64"
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
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.entity}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${payment.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                           {payment.type === 'incoming' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                           <span className="capitalize text-xs">{payment.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-right">
                         {getStatusBadge(payment.status)}
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
