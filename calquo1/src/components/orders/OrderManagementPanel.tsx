import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { approvalService } from '../../utils/firebase/approvalService';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  CheckCircle2, XCircle, Clock, Truck, Building2, 
  CreditCard, Package, AlertCircle, RefreshCw, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/input';

interface Order {
  id: string;
  stockName: string;
  totalQuantity: number;
  totalAmount: number;
  status: string;
  paymentMode: 'direct' | 'finance';
  paymentGateway?: string;
  buyerId: string;
  buyerName: string;
  buyerCompany?: string;
  sellerId: string;
  sellerName: string;
  sellerCompany?: string;
  logisticsPartnerId: string;
  logisticsPartnerName: string;
  financialAgentId?: string;
  financialAgentName?: string;
  approvals?: {
    seller?: { status: string; userName: string; timestamp: string; reason?: string };
    logistics?: { status: string; userName: string; timestamp: string; reason?: string };
    financial?: { status: string; userName: string; timestamp: string; reason?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export function OrderManagementPanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showLogisticsDialog, setShowLogisticsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [logisticsPartners, setLogisticsPartners] = useState<any[]>([]);
  const [selectedLogistics, setSelectedLogistics] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Determine user role in orders
  const getUserRole = (order: Order): 'buyer' | 'seller' | 'logistics' | 'financial' | null => {
    if (!user) return null;
    if (order.buyerId === user.id) return 'buyer';
    if (order.sellerId === user.id) return 'seller';
    if (order.logisticsPartnerId === user.id) return 'logistics';
    if (order.financialAgentId === user.id) return 'financial';
    return null;
  };

  // Fetch orders
  useEffect(() => {
    if (!firebaseDb || !user) {
      setLoading(false);
      return;
    }

    const queries = [
      query(collection(firebaseDb, 'purchase_requests'), where('buyerId', '==', user.id)),
      query(collection(firebaseDb, 'purchase_requests'), where('sellerId', '==', user.id)),
      query(collection(firebaseDb, 'purchase_requests'), where('logisticsPartnerId', '==', user.id)),
      query(collection(firebaseDb, 'purchase_requests'), where('financialAgentId', '==', user.id))
    ];

    const unsubscribes = queries.map(q => 
      onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        setOrders(prev => {
          // Merge and deduplicate orders
          const merged = [...prev];
          fetchedOrders.forEach(newOrder => {
            const existingIndex = merged.findIndex(o => o.id === newOrder.id);
            if (existingIndex >= 0) {
              merged[existingIndex] = newOrder;
            } else {
              merged.push(newOrder);
            }
          });
          return merged.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setLoading(false);
      }, (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Load logistics partners when needed
  useEffect(() => {
    if (!showLogisticsDialog || !firebaseDb) return;

    const q = query(collection(firebaseDb, 'users'), where('role', '==', 'logistics_agent'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().company_name || doc.data().owner_name || doc.data().displayName || 'Unnamed Partner',
        state: doc.data().state || '',
        mobile: doc.data().mobile || doc.data().mobile_number || '',
        ...doc.data()
      }));
      setLogisticsPartners(partners);
    });

    return () => unsubscribe();
  }, [showLogisticsDialog]);

  const handleApprove = async () => {
    if (!selectedOrder || !user) return;

    const role = getUserRole(selectedOrder);
    if (!role || role === 'buyer') return;

    try {
      await approvalService.handleApprovalDecision({
        requestId: selectedOrder.id,
        role,
        decision: 'approved',
        userId: user.id,
        userName: user.profile?.displayName || user.email || 'Unknown User'
      });

      toast.success(`✅ Order approved successfully!`);
      setShowApprovalDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve order');
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !user) return;

    const role = getUserRole(selectedOrder);
    if (!role || role === 'buyer') return;

    try {
      await approvalService.handleApprovalDecision({
        requestId: selectedOrder.id,
        role,
        decision: 'rejected',
        userId: user.id,
        userName: user.profile?.displayName || user.email || 'Unknown User',
        reason: rejectionReason
      });

      toast.success(`❌ Order rejected`);
      setShowApprovalDialog(false);
      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject order');
    }
  };

  const handleLogisticsReselection = async () => {
    if (!selectedOrder || !selectedLogistics) return;

    const partner = logisticsPartners.find(p => p.id === selectedLogistics);
    if (!partner) return;

    try {
      await approvalService.reselectLogisticsPartner({
        requestId: selectedOrder.id,
        newLogisticsPartnerId: partner.id,
        newLogisticsPartnerName: partner.name,
        newLogisticsPartnerMobile: partner.mobile
      });

      toast.success(`✅ New logistics partner assigned!`);
      setShowLogisticsDialog(false);
      setSelectedOrder(null);
      setSelectedLogistics('');
    } catch (error) {
      console.error('Logistics reselection error:', error);
      toast.error('Failed to update logistics partner');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      'pending_multi_party_approval': { 
        label: 'Pending Approval', 
        variant: 'secondary',
        icon: Clock 
      },
      'pending_logistics_reselection': { 
        label: 'Reselect Logistics', 
        variant: 'destructive',
        icon: AlertCircle 
      },
      'approved': { 
        label: 'Approved', 
        variant: 'default',
        icon: CheckCircle2 
      },
      'cancelled': { 
        label: 'Cancelled', 
        variant: 'destructive',
        icon: XCircle 
      },
      'pending_seller_ack': { 
        label: 'Pending Seller', 
        variant: 'secondary',
        icon: Clock 
      }
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canApprove = (order: Order) => {
    const role = getUserRole(order);
    if (!role || role === 'buyer') return false;

    const approvals = order.approvals || {};
    const approval = approvals[role];

    // Can approve if not yet approved/rejected
    return !approval || approval.status === null;
  };

  const filteredLogistics = logisticsPartners.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order Management</h2>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => {
            const userRole = getUserRole(order);
            const approvals = order.approvals || {};

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{order.stockName}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.totalQuantity} units • ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parties Involved */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Buyer</p>
                      <p className="font-medium">{order.buyerCompany || order.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Seller</p>
                      <p className="font-medium">{order.sellerCompany || order.sellerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Logistics</p>
                      <p className="font-medium">{order.logisticsPartnerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment</p>
                      <Badge variant={order.paymentMode === 'direct' ? 'default' : 'secondary'}>
                        {order.paymentMode === 'direct' ? 'Direct' : 'Finance'}
                        {order.paymentGateway && ` (${order.paymentGateway.toUpperCase()})`}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Approval Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Approval Status:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        {approvals.seller?.status === 'approved' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : approvals.seller?.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">Seller</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {approvals.logistics?.status === 'approved' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : approvals.logistics?.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">Logistics</span>
                      </div>
                      {order.paymentMode === 'finance' && (
                        <div className="flex items-center gap-2">
                          {approvals.financial?.status === 'approved' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : approvals.financial?.status === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">Financial</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {userRole === 'buyer' && order.status === 'pending_logistics_reselection' && (
                      <Button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowLogisticsDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Select New Logistics Partner
                      </Button>
                    )}
                    
                    {canApprove(order) && order.status === 'pending_multi_party_approval' && (
                      <Button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowApprovalDialog(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Review & Approve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Order</DialogTitle>
            <DialogDescription>
              Approve or reject this purchase request
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">{selectedOrder.stockName}</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.totalQuantity} units • ₹{selectedOrder.totalAmount.toLocaleString()}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">From:</span>
                  <span className="font-medium">{selectedOrder.sellerCompany || selectedOrder.sellerName}</span>
                  <span className="text-gray-500">To:</span>
                  <span className="font-medium">{selectedOrder.buyerCompany || selectedOrder.buyerName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rejection Reason (Optional)</Label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logistics Reselection Dialog */}
      <Dialog open={showLogisticsDialog} onOpenChange={setShowLogisticsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select New Logistics Partner</DialogTitle>
            <DialogDescription>
              Choose a different logistics partner for this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <RadioGroup value={selectedLogistics} onValueChange={setSelectedLogistics}>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredLogistics.map(partner => (
                    <div
                      key={partner.id}
                      className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                        selectedLogistics === partner.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedLogistics(partner.id)}
                    >
                      <RadioGroupItem value={partner.id} id={partner.id} />
                      <Label htmlFor={partner.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{partner.name}</div>
                        {partner.state && <div className="text-sm text-muted-foreground">📍 {partner.state}</div>}
                        {partner.mobile && <div className="text-sm text-muted-foreground">📞 {partner.mobile}</div>}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogisticsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogisticsReselection}
              disabled={!selectedLogistics}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
