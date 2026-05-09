
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  CreditCard, 
  Shield, 
  AlertCircle, 
  Package,
  ChevronRight
} from 'lucide-react';
import { FinancialAgentSelectionDialog } from './FinancialAgentSelectionDialog';
import { BuyNowFlow, BuyNowItem } from '../orders/BuyNowFlow';
import { useNavigate } from 'react-router-dom'; // Assuming react-router is used, or fallback to window.location

export function PurchaseRequestDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sent');
  const [sentRequests, setSentRequests] = useState<PurchaseRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PurchaseRequest[]>([]);
  const [financialRequests, setFinancialRequests] = useState<PurchaseRequest[]>([]); // For agents
  const [loading, setLoading] = useState(true);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  // Buy Now Flow state
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState<BuyNowItem[]>([]);
  const [currentProductName, setCurrentProductName] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    // Buyers see Sent requests
    if (user.role === 'retailer' || user.role === 'trader') {
      const sub = purchaseService.subscribeToRequests(user.id, 'buyer', (data) => {
        setSentRequests(data);
        setLoading(false);
      });
      unsubscribers.push(sub);
    }

    // Sellers see Received requests
    if (user.role === 'manufacturer' || user.role === 'trader') {
      const sub = purchaseService.subscribeToRequests(user.id, 'seller', (data) => {
        setReceivedRequests(data);
        setLoading(false);
      });
      unsubscribers.push(sub);
    }

    // Financial Agents see assigned requests
    if (user.role === 'financial') {
      const sub = purchaseService.subscribeToRequests(user.id, 'financial', (data) => {
        setFinancialRequests(data);
        setLoading(false);
        setActiveTab('financial'); // Default to financial tab for agents
      });
      unsubscribers.push(sub);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [user]);

  const handleAcknowledge = async (requestId: string) => {
    try {
      await purchaseService.updateStatus(requestId, 'seller_acknowledged');
      toast.success('Request acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge request');
    }
  };

  const handlePayDirectly = async (request: PurchaseRequest) => {
    // Prepare items for BuyNowFlow
    const items: BuyNowItem[] = request.items.map((item, index) => ({
      id: item.combinationId || `item-${index}`,
      name: request.stockName,
      quantity: item.quantity,
      price: item.pricePerUnit,
      image: request.stockImage,
      sellerId: request.sellerId,
      seller_name: request.sellerName
    }));

    setBuyNowItems(items);
    setCurrentProductName(request.stockName);
    setSelectedRequestId(request.id);
    setShowBuyNow(true);
  };

  const handleBuyNowSuccess = async () => {
    if (selectedRequestId) {
      // We don't have the orderId here easily from BuyNowFlow callback unfortunately unless we modify it
      // But BuyNowFlow creates the order.
      // We can just mark the request as paid.
      // Ideally, BuyNowFlow should return the orderId.
      // For now, we will just mark it paid and not link specific ID if missing, or we rely on the fact that
      // BuyNowFlow logs the payment.
      
      // Actually, let's just update status to paid.
      try {
         // We use a placeholder order ID since we don't capture it from BuyNowFlow's void callback
         // In a real implementation, BuyNowFlow's onSuccess should pass the orderId.
         await purchaseService.markRequestPaid(selectedRequestId, `ORDER-${Date.now()}`);
         toast.success('Order confirmed and request updated!');
      } catch (e) {
         console.error(e);
      }
    }
    setShowBuyNow(false);
  };

  const handlePayViaAgent = (requestId: string) => {
    setSelectedRequestId(requestId);
    setAgentDialogOpen(true);
  };

  const handleAgentSelection = async (agent: { id: string; name: string }) => {
    if (!selectedRequestId) return;
    
    try {
      await purchaseService.assignAgent(selectedRequestId, agent.id, agent.name);
      toast.success(`Request sent to financial agent: ${agent.name}`);
    } catch (error) {
      toast.error('Failed to assign agent');
    }
  };

  const handleAgentPayment = async (requestId: string) => {
    try {
      // Simulate Payment Gateway for Agent
      // In a real scenario, this would also open a payment flow
      const promise = new Promise((resolve) => setTimeout(resolve, 2000));
      toast.promise(promise, {
        loading: 'Processing agent payment...',
        success: 'Payment successful! Order confirmed for buyer.',
        error: 'Payment failed'
      });
      await promise;
      
      await purchaseService.completePayment(requestId, `TXN-AGENT-${Date.now()}`, 'agent');
    } catch (error) {
      toast.error('Payment failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_seller_ack':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Ack</Badge>;
      case 'seller_acknowledged':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Acknowledged</Badge>;
      case 'pending_agent':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Pending Agent</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid & Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading requests...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Requests</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-[600px]">
          {user?.role !== 'financial' && (
            <>
              <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
              <TabsTrigger value="received">Received ({receivedRequests.length})</TabsTrigger>
            </>
          )}
          {user?.role === 'financial' && (
            <TabsTrigger value="financial">Pending Payments ({financialRequests.length})</TabsTrigger>
          )}
        </TabsList>

        {/* Sent Requests (Buyer View) */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No requests sent</h3>
              <p className="text-muted-foreground">Browse stock to make a purchase request.</p>
            </div>
          ) : (
            sentRequests.map(request => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {request.stockName}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription>
                        Sent to {request.sellerCompany || request.sellerName} • {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">₹{request.totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{request.totalQuantity} items</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Request ID:</span> {request.id}</p>
                      {request.financialAgentName && (
                        <p className="text-sm flex items-center gap-1">
                          <Shield className="h-3 w-3 text-purple-600" />
                          <span className="font-medium">Financial Agent:</span> {request.financialAgentName}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions for Buyer */}
                    {request.status === 'seller_acknowledged' && (
                      <div className="flex gap-3">
                        <Button onClick={() => handlePayDirectly(request)} className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          Pay Directly
                        </Button>
                        <Button variant="outline" onClick={() => handlePayViaAgent(request.id)} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                          <Shield className="h-4 w-4" />
                          Pay via Agent
                        </Button>
                      </div>
                    )}
                    {request.status === 'pending_agent' && (
                      <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Waiting for Agent Payment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Received Requests (Seller View) */}
        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No requests received</h3>
            </div>
          ) : (
            receivedRequests.map(request => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {request.stockName}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription>
                        From {request.buyerCompany || request.buyerName} • {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">₹{request.totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{request.totalQuantity} items</div>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="bg-muted/30 py-3 flex justify-end gap-3">
                  {request.status === 'pending_seller_ack' && (
                    <Button onClick={() => handleAcknowledge(request.id)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Acknowledge Request
                    </Button>
                  )}
                  {request.status === 'seller_acknowledged' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Waiting for buyer payment
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Financial Agent View */}
        <TabsContent value="financial" className="space-y-4">
          {financialRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No pending payments</h3>
            </div>
          ) : (
            financialRequests.map(request => (
              <Card key={request.id} className="border-purple-200">
                <CardHeader className="bg-purple-50/30 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.stockName}</CardTitle>
                      <CardDescription>
                        Buyer: {request.buyerCompany} • Seller: {request.sellerCompany}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                      Payment Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">₹{request.totalAmount.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Total Amount Payable</p>
                    </div>
                    <Button 
                      onClick={() => handleAgentPayment(request.id)} 
                      className="bg-purple-600 hover:bg-purple-700 gap-2"
                      disabled={request.status !== 'pending_agent'}
                    >
                      <CreditCard className="h-4 w-4" />
                      Make Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <FinancialAgentSelectionDialog 
        open={agentDialogOpen} 
        onClose={() => setAgentDialogOpen(false)} 
        onSelect={handleAgentSelection}
      />

      {/* Buy Now Flow for Direct Payment */}
      <BuyNowFlow
        open={showBuyNow}
        onOpenChange={setShowBuyNow}
        items={buyNowItems}
        productName={currentProductName}
        onSuccess={handleBuyNowSuccess}
      />
    </div>
  );
}
