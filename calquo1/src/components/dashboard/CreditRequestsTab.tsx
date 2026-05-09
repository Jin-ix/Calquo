import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../auth/AuthProvider';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { toast } from 'sonner';

export function CreditRequestsTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.gstNumber && !user?.profile?.gstNumber) {
        setLoading(false);
        return;
    }

    const agentGst = user.gstNumber || user.profile?.gstNumber;

    const q = query(
      collection(firebaseDb, 'orders'),
      where('financeAgentGst', '==', agentGst),
      // where('paymentMode', '==', 'finance'), // implied
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(orders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching credit requests:", error);
      // Fallback for demo if index missing or error
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAction = async (orderId: string, action: 'approved' | 'rejected') => {
    setProcessingId(orderId);
    try {
      const orderRef = doc(firebaseDb, 'orders', orderId);
      await updateDoc(orderRef, {
        financeStatus: action,
        status: action === 'approved' ? 'awaiting_seller_confirmation' : 'payment_failed', // or cancelled
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Request ${action === 'approved' ? 'Approved' : 'Rejected'}`, {
        description: `Order #${orderId.slice(0, 8)} has been updated.`
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      case 'pending_finance_approval':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle>Credit Requests</CardTitle>
        <CardDescription>Manage financing requests from retailers</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No credit requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{request.buyerName || 'Unknown Retailer'}</span>
                            <span className="text-xs text-muted-foreground">{request.buyerCompany}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(request.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {request.creditTerms || '30 Days'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.financeStatus || request.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(request.financeStatus === 'pending' || request.status === 'pending_finance_approval') ? (
                           <>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                               onClick={() => handleAction(request.id, 'rejected')}
                               disabled={!!processingId}
                             >
                               {processingId === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-4 w-4" />}
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                               onClick={() => handleAction(request.id, 'approved')}
                               disabled={!!processingId}
                             >
                               {processingId === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                             </Button>
                           </>
                        ) : (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
