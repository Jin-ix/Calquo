import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package,
  Building2,
  Truck,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { approvalService } from '../../utils/firebase/approvalService';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export function ApprovalPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Determine which requests to show based on user role
    let roleType: 'seller' | 'logistics' | 'financial' | null = null;
    
    if (user.role === 'manufacturer' || user.role === 'trader') {
      roleType = 'seller';
    } else if (user.role === 'logistics_agent') {
      roleType = 'logistics';
    } else if (user.role === 'financial') {
      roleType = 'financial';
    }

    if (!roleType) {
      setLoading(false);
      return;
    }

    const unsubscribe = purchaseService.subscribeToRequests(user.id, roleType, (data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getUserRole = (): 'seller' | 'logistics' | 'financial' => {
    if (user?.role === 'logistics_agent') return 'logistics';
    if (user?.role === 'financial') return 'financial';
    return 'seller';
  };

  const handleApprove = async (request: PurchaseRequest) => {
    if (!user) return;
    
    setProcessingId(request.id);
    try {
      await approvalService.handleApprovalDecision({
        requestId: request.id,
        role: getUserRole(),
        decision: 'approved',
        userId: user.id,
        userName: user.displayName || user.company_name || 'Unknown User'
      });
      
      toast.success('Request approved successfully!');
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !user) return;
    
    setProcessingId(selectedRequest.id);
    setShowRejectDialog(false);
    
    try {
      await approvalService.handleApprovalDecision({
        requestId: selectedRequest.id,
        role: getUserRole(),
        decision: 'rejected',
        userId: user.id,
        userName: user.displayName || user.company_name || 'Unknown User',
        reason: rejectionReason || 'No reason provided'
      });
      
      toast.success('Request rejected');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
      setRejectionReason('');
    }
  };

  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const getApprovalStatus = (request: PurchaseRequest, role: 'seller' | 'logistics' | 'financial') => {
    const approval = request.approvals?.[role];
    if (!approval) return 'pending';
    return approval.status;
  };

  const getRoleLabel = () => {
    const role = getUserRole();
    switch (role) {
      case 'seller': return 'Seller';
      case 'logistics': return 'Logistics Agent';
      case 'financial': return 'Financial Agent';
      default: return 'Your';
    }
  };

  const getRoleIcon = () => {
    const role = getUserRole();
    switch (role) {
      case 'seller': return Building2;
      case 'logistics': return Truck;
      case 'financial': return DollarSign;
      default: return User;
    }
  };

  const isRequestPending = (request: PurchaseRequest) => {
    const role = getUserRole();
    const status = getApprovalStatus(request, role);
    return status === 'pending';
  };

  const pendingRequests = requests.filter(isRequestPending);
  const approvedRequests = requests.filter(r => getApprovalStatus(r, getUserRole()) === 'approved');
  const rejectedRequests = requests.filter(r => getApprovalStatus(r, getUserRole()) === 'rejected');

  const RoleIcon = getRoleIcon();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-3 text-gray-400" />
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  const RequestCard = ({ request, isPending }: { request: PurchaseRequest; isPending: boolean }) => {
    const isExpanded = expandedRequests.has(request.id);
    const isProcessing = processingId === request.id;
    const role = getUserRole();
    const myApprovalStatus = getApprovalStatus(request, role);

    return (
      <Card key={request.id} className={`overflow-hidden ${isPending ? 'border-blue-200' : ''}`}>
        <CardHeader className={`pb-3 ${isPending ? 'bg-blue-50/50' : 'bg-muted/30'}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{request.stockName}</CardTitle>
                {myApprovalStatus === 'approved' && (
                  <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
                )}
                {myApprovalStatus === 'rejected' && (
                  <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                )}
                {myApprovalStatus === 'pending' && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <Clock className="h-3 w-3 mr-1" />Pending
                  </Badge>
                )}
              </div>
              <CardDescription>
                {role === 'seller' && `From ${request.buyerCompany || request.buyerName}`}
                {role === 'logistics' && `${request.sellerCompany || request.sellerName} → ${request.buyerCompany || request.buyerName}`}
                {role === 'financial' && `Buyer: ${request.buyerCompany || request.buyerName}`}
                {' • '}
                {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
              </CardDescription>
            </div>
            <div className="text-right ml-4">
              <div className="text-xl font-bold text-gray-900">₹{request.totalAmount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{request.totalQuantity} items</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Buyer</p>
                <p className="text-sm font-medium">{request.buyerCompany || request.buyerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Seller</p>
                <p className="text-sm font-medium">{request.sellerCompany || request.sellerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Logistics</p>
                <p className="text-sm font-medium">{request.logisticsAgentName || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Payment Mode</p>
                <p className="text-sm font-medium">
                  {request.paymentMode === 'direct' ? 'Direct Payment' : 'Through Financial Agent'}
                </p>
              </div>
            </div>
          </div>

          {/* Approval Status from all parties */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Approval Status</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-gray-500" />
                <span className="text-xs">Seller:</span>
                {getApprovalStatus(request, 'seller') === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {getApprovalStatus(request, 'seller') === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                {getApprovalStatus(request, 'seller') === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-3 w-3 text-gray-500" />
                <span className="text-xs">Logistics:</span>
                {getApprovalStatus(request, 'logistics') === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {getApprovalStatus(request, 'logistics') === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                {getApprovalStatus(request, 'logistics') === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
              </div>
              {request.paymentMode === 'finance' && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span className="text-xs">Financial:</span>
                  {getApprovalStatus(request, 'financial') === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {getApprovalStatus(request, 'financial') === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                  {getApprovalStatus(request, 'financial') === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                </div>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpanded(request.id)}
            className="w-full mb-3"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Details
              </>
            )}
          </Button>

          {isExpanded && (
            <div className="border-t pt-4 space-y-4">
              {/* Items Table */}
              <div>
                <p className="text-sm font-semibold mb-2">Order Items</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-2 font-semibold">Variant</th>
                        <th className="text-right p-2 font-semibold">Qty</th>
                        <th className="text-right p-2 font-semibold">Price/Unit</th>
                        <th className="text-right p-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {request.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            {item.colorId && item.sizeId ? `${item.sizeId} • ${item.colorId}` : item.combinationId}
                          </td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">₹{item.pricePerUnit.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              {request.specialInstructions && (
                <div>
                  <p className="text-sm font-semibold mb-1">Special Instructions</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                    {request.specialInstructions}
                  </p>
                </div>
              )}

              {/* Request ID */}
              <div>
                <p className="text-xs text-muted-foreground">Request ID: {request.id}</p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        {isPending && (
          <CardFooter className="bg-muted/30 py-3 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleRejectClick(request)}
              disabled={isProcessing}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApprove(request)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Request
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <RoleIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getRoleLabel()} Approvals</h1>
          <p className="text-sm text-muted-foreground">Review and approve purchase requests</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 max-w-[500px]">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} isPending={true} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No approved requests</h3>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {approvedRequests.map(request => (
                  <RequestCard key={request.id} request={request} isPending={false} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <XCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No rejected requests</h3>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {rejectedRequests.map(request => (
                  <RequestCard key={request.id} request={request} isPending={false} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Reject Purchase Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getUserRole() === 'seller' && 'Rejecting this request will cancel the entire order.'}
              {getUserRole() === 'logistics' && 'Rejecting this request will allow the buyer to select another logistics partner.'}
              {getUserRole() === 'financial' && 'Rejecting this request will cancel the entire order.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Reason for rejection (optional)
            </label>
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
