import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package,
  Truck,
  Building2,
  Store,
  AlertCircle,
  RefreshCcw,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { toast } from 'sonner';

interface OrderTrackingPageProps {
  requestId: string;
  onReselectLogistics?: () => void;
  onProceedToPayment?: () => void;
}

export function OrderTrackingPage({ 
  requestId, 
  onReselectLogistics,
  onProceedToPayment 
}: OrderTrackingPageProps) {
  const { user } = useAuth();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = purchaseService.subscribeToRequests(
      user.email,
      'buyer',
      (requests) => {
        const foundRequest = requests.find(r => r.id === requestId);
        if (foundRequest) {
          setRequest(foundRequest);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId, user?.email]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-pulse" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Purchase request not found
        </AlertDescription>
      </Alert>
    );
  }

  const approvals = request.approvals || {};
  const sellerStatus = approvals.seller?.status || request.sellerApproval || 'pending';
  const logisticsStatus = approvals.logistics?.status || request.logisticsApproval || 'pending';
  const financialStatus = request.paymentMode === 'finance' 
    ? (approvals.financial?.status || request.financialApproval || 'pending')
    : 'not_required';

  const allApproved = 
    sellerStatus === 'approved' && 
    logisticsStatus === 'approved' && 
    (request.paymentMode === 'direct' || financialStatus === 'approved');

  const anyRejected = 
    sellerStatus === 'rejected' || 
    (request.paymentMode === 'finance' && financialStatus === 'rejected');

  const logisticsRejected = logisticsStatus === 'rejected';

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === 'rejected') return <XCircle className="h-5 w-5 text-red-600" />;
    if (status === 'not_required') return <CheckCircle2 className="h-5 w-5 text-gray-400" />;
    return <Clock className="h-5 w-5 text-amber-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
    }
    if (status === 'not_required') {
      return <Badge className="bg-gray-100 text-gray-600 border-gray-300">N/A</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Purchase Request Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{request.stockName}</p>
                <p className="text-sm text-muted-foreground">From: {request.sellerCompany || request.sellerName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-xl text-blue-700">₹{request.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{request.totalQuantity} units</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Request ID: {request.id}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Seller Approval */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(sellerStatus)}
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-600" />
                    <p className="font-medium">Seller</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.sellerCompany || request.sellerName}</p>
                  {approvals.seller?.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(approvals.seller.timestamp).toLocaleString()}
                    </p>
                  )}
                  {approvals.seller?.reason && (
                    <p className="text-xs text-gray-700 mt-1 italic">"{approvals.seller.reason}"</p>
                  )}
                </div>
              </div>
              {getStatusBadge(sellerStatus)}
            </div>

            {/* Logistics Approval */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(logisticsStatus)}
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-600" />
                    <p className="font-medium">Logistics Agent</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.logisticsAgentName}</p>
                  {approvals.logistics?.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(approvals.logistics.timestamp).toLocaleString()}
                    </p>
                  )}
                  {approvals.logistics?.reason && (
                    <p className="text-xs text-gray-700 mt-1 italic">"{approvals.logistics.reason}"</p>
                  )}
                </div>
              </div>
              {getStatusBadge(logisticsStatus)}
            </div>

            {/* Financial Agent Approval (if payment mode is 'finance') */}
            {request.paymentMode === 'finance' && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(financialStatus)}
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-600" />
                      <p className="font-medium">Financial Agent</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.financialAgentName}</p>
                    {approvals.financial?.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(approvals.financial.timestamp).toLocaleString()}
                      </p>
                    )}
                    {approvals.financial?.reason && (
                      <p className="text-xs text-gray-700 mt-1 italic">"{approvals.financial.reason}"</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(financialStatus)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {anyRejected && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">Order Cancelled</p>
            <p>
              {sellerStatus === 'rejected' && 'The seller has rejected this request.'}
              {financialStatus === 'rejected' && 'The financial agent has rejected this request.'}
              {' '}The order has been cancelled and cannot proceed.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {logisticsRejected && !anyRejected && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <p className="font-semibold mb-1 text-amber-900">Logistics Agent Rejected</p>
            <p className="text-amber-800">
              The logistics agent has declined this delivery. Please select another logistics partner to continue.
            </p>
            {onReselectLogistics && (
              <Button 
                onClick={onReselectLogistics}
                className="mt-3 bg-amber-600 hover:bg-amber-700"
                size="sm"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Select Another Logistics Agent
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {allApproved && !anyRejected && !logisticsRejected && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-semibold mb-1 text-green-900">All Approvals Received!</p>
            <p className="text-green-800 mb-3">
              {request.paymentMode === 'direct' 
                ? 'All parties have approved your request. You can now proceed with payment.'
                : 'All parties have approved your request. The financial agent will process the payment.'}
            </p>
            {request.paymentMode === 'direct' && onProceedToPayment && (
              <Button 
                onClick={onProceedToPayment}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!allApproved && !anyRejected && !logisticsRejected && (
        <Alert className="border-blue-300 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <p className="font-semibold mb-1 text-blue-900">Awaiting Approvals</p>
            <p className="text-blue-800">
              Your purchase request is being reviewed. You'll be notified when all parties respond.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
