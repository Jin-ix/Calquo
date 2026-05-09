import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  Package,
  Calendar,
  Star,
  Eye,
  RotateCcw,
  Truck,
  Search,
  Check,
  Clock,
  RefreshCw,
  CreditCard,
  AlertCircle,
  X,
  Shield,
  ShieldCheck
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { OrderTrackingTimeline, OrderStatus } from './OrderTrackingTimeline';
import { PaymentConfirmationDialog } from './PaymentConfirmationDialog';
import { StunningRatingDialog } from '../rating/StunningRatingDialog';
import { toast } from 'sonner';

interface Order {
  id: string;
  itemName: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplierName: string;
  supplierId: string;
  orderDate: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'payment_required' | 'paid' | 'failed';
  deliveryAddress: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  paymentMethod: string;
  specialInstructions?: string;
  deliveryTime?: string;
  category?: string;
  needsPaymentConfirmation?: boolean;
  acceptanceDate?: string;
  rejectionReason?: string;
  escrowStatus?: string;
  proposedMiddlemanId?: string | null;
  proposingParty?: string | null;
}

interface MyOrdersViewProps {
  orders: Order[];
  onReturnRequest?: (orderId: string, reason: string) => void;
}

const mapFirebaseStatus = (fbStatus: string): OrderStatus => {
  switch (fbStatus) {
    case 'pending_seller_ack':
    case 'pending_seller_approval':
      return 'request_sent';
    case 'seller_acknowledged':
    case 'terms_accepted':
      return 'accepted';
    case 'pending_agent': return 'accepted';
    case 'paid': return 'confirmed';
    case 'shipped': return 'shipped';
    case 'out-for-delivery': return 'out-for-delivery';
    case 'delivered': return 'delivered';
    case 'rejected':
    case 'terms_rejected':
      return 'rejected';
    case 'cancelled': return 'cancelled';
    default: return 'processed';
  }
};

export function MyOrdersView({ orders, onReturnRequest }: MyOrdersViewProps) {
  const { user } = useAuth();
  const { cancelOrder, submitReview, getOrderReview } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showRatingReviewDialog, setShowRatingReviewDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>(orders);
  const [reqOrders, setReqOrders] = useState<Order[]>([]);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Real-time order updates from Firebase
  useEffect(() => {
    if (!user?.id || !firebaseDb) return;

    // We want all requests where buyerId matches current user
    const requestsRef = collection(firebaseDb, 'purchase_requests');
    const q1 = query(requestsRef, where('buyerId', '==', user.id));

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        const status = mapFirebaseStatus(data.status);

        // Map Firestore data to Order interface
        return {
          id: doc.id,
          itemName: data.stockName || (data.items && data.items.length > 0 ? `${data.items[0].colorId}/${data.items[0].sizeId}` : 'Unknown Item'),
          itemId: data.stockId || '',
          quantity: data.totalQuantity || 0,
          unitPrice: data.items?.[0]?.pricePerUnit || 0,
          totalAmount: data.totalAmount || 0,
          supplierName: data.sellerCompany || data.sellerName || 'Unknown Supplier',
          supplierId: data.sellerId,
          orderDate: data.createdAt,
          status: status,
          paymentStatus: data.paymentStatus || 'pending',
          deliveryAddress: data.deliveryAddress || '',
          estimatedDelivery: data.estimatedDelivery,
          trackingNumber: data.trackingNumber,
          paymentMethod: data.paymentMethod || 'standard',
          specialInstructions: data.notes,
          needsPaymentConfirmation: status === 'accepted' && data.paymentStatus !== 'paid',
          acceptanceDate: data.updatedAt,
          rejectionReason: data.rejectionReason,
          escrowStatus: data.escrow_status,
          proposedMiddlemanId: data.proposed_middleman_id,
          proposingParty: data.proposing_party,
        } as Order;
      });

      setReqOrders(fetchedOrders);
      setLastRefresh(new Date());
    }, (error) => {
      console.error("Error fetching purchase_requests:", error);
    });

    const ordersRef = collection(firebaseDb, 'orders');
    // BuyNowFlow uses user.email as buyerId
    const q2 = query(ordersRef, where('buyerId', '==', user.email || user.id));

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        // Since the new orders flow only writes simple status string, we can treat them directly unless we need complex mapping.
        const status = mapFirebaseStatus(data.status || 'pending');
        const firstItem = data.items?.[0];

        return {
          id: doc.id,
          itemName: firstItem?.product_name || 'Multiple Items',
          itemId: firstItem?.product_id || '',
          quantity: data.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0,
          unitPrice: firstItem?.price_per_unit || 0,
          totalAmount: data.total || 0,
          supplierName: 'Supplier via Calico', // Later use actual seller name
          supplierId: '',
          orderDate: data.createdAt || new Date().toISOString(),
          status: status,
          paymentStatus: data.payment_status || 'pending',
          deliveryAddress: data.delivery_address || '',
          estimatedDelivery: data.estimated_delivery,
          trackingNumber: data.tracking_number,
          paymentMethod: data.payment_method || 'standard',
          specialInstructions: data.special_instructions,
          needsPaymentConfirmation: status === 'accepted' && data.payment_status !== 'paid',
          acceptanceDate: data.updatedAt,
          rejectionReason: data.rejection_reason,
          escrowStatus: data.escrow_status,
          proposedMiddlemanId: data.proposed_middleman_id,
          proposingParty: data.proposing_party,
        } as Order;
      });

      setNewOrders(fetchedOrders);
      setLastRefresh(new Date());
    }, (error) => {
      console.error("Error fetching new orders:", error);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user?.id, user?.email]);

  useEffect(() => {
    const combinedOrders = [...reqOrders, ...newOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    setRealtimeOrders(combinedOrders);
  }, [reqOrders, newOrders]);

  // Use realtime orders if available, otherwise fall back to props
  const currentOrders = realtimeOrders.length > 0 ? realtimeOrders : orders;

  // Filter and split orders into two categories
  const { confirmedOrders, purchaseRequests } = useMemo(() => {
    const filteredOrders = currentOrders.filter(order => {
      const matchesSearch = order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    // Split orders into confirmed orders and purchase requests
    const confirmed = filteredOrders.filter(order =>
      ['confirmed', 'processed', 'shipped', 'out-for-delivery', 'delivered'].includes(order.status)
    );

    const requests = filteredOrders.filter(order =>
      ['request_sent', 'accepted', 'rejected', 'cancelled'].includes(order.status)
    );

    return { confirmedOrders: confirmed, purchaseRequests: requests };
  }, [currentOrders, searchTerm, statusFilter]);

  // Manual refresh function
  const handleRefresh = () => {
    // Since we are using real-time listeners, data is already fresh.
    setLastRefresh(new Date());
    toast.success('Orders are up to date (Real-time connection active)');
  };



  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered': return 'bg-black text-white hover:bg-zinc-900 border-black';
      case 'out-for-delivery': return 'bg-white text-zinc-900 border-zinc-900 hover:bg-zinc-50';
      case 'shipped': return 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200';
      case 'processed': return 'bg-white text-zinc-600 border-zinc-300 border-dashed';
      case 'confirmed': return 'bg-black text-white hover:bg-zinc-800 border-black';
      case 'accepted': return 'bg-zinc-900 text-white hover:bg-black border-zinc-900';
      case 'request_sent': return 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100';
      case 'cancelled': return 'bg-zinc-50 text-zinc-400 border-zinc-200 line-through';
      default: return 'bg-white text-zinc-500 border-zinc-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'request_sent': return 'Request Sent';
      case 'accepted': return 'Accepted';
      case 'confirmed': return 'Confirmed';
      case 'processed': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'out-for-delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const canRateOrder = (order: Order): boolean => {
    return order.status === 'delivered' && user?.role === 'retailer';
  };

  const hasOrderReview = (order: Order): boolean => {
    return !!getOrderReview(order.id);
  };

  const canReturnOrder = (order: Order): boolean => {
    if (order.status !== 'delivered') return false;

    // Allow returns within 7 days of delivery
    const deliveryDate = new Date(order.orderDate); // This should be actual delivery date
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 3600 * 24));

    return daysDifference <= 7;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleRateAndReview = (order: Order) => {
    setSelectedOrder(order);
    setShowRatingReviewDialog(true);
  };

  const handleReturnOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowReturnDialog(true);
  };

  const handlePaymentConfirmation = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentConfirmation(true);
  };

  const handleCancelOrder = (order: Order) => {
    if (window.confirm(`Are you sure you want to cancel order #${order.id}?`)) {
      cancelOrder(order.id);
    }
  };



  const handleReturnSubmit = () => {
    if (!selectedOrder || !returnReason.trim()) return;

    if (onReturnRequest) {
      onReturnRequest(selectedOrder.id, returnReason.trim());
      toast.success('Return request submitted successfully!');
    }

    setShowReturnDialog(false);
    setSelectedOrder(null);
    setReturnReason('');
  };

  const handleReviewSubmit = (reviewData: {
    orderId: string;
    productRating?: any;
    supplierRating?: any;
  }) => {
    submitReview(reviewData);
    setShowRatingReviewDialog(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-4xl font-serif tracking-tight text-zinc-900 mb-2">My Orders</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
            {confirmedOrders.length + purchaseRequests.length} total orders
            {statusFilter !== 'all' && ` • Filtered by: ${getStatusLabel(statusFilter as OrderStatus)}`}
            <span className="ml-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold h-10 px-4"
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="SEARCH ORDERS BY ITEM NAME, SUPPLIER, OR ORDER ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-none border-zinc-200 h-12 uppercase text-[10px] tracking-widest font-medium placeholder:text-zinc-400 focus-visible:ring-black"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64 rounded-none border-zinc-200 h-12 uppercase text-[10px] tracking-[0.1em] font-medium focus:ring-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-zinc-200">
            <SelectItem value="all" className="uppercase text-[10px] tracking-widest font-medium">All Orders & Requests</SelectItem>
            <SelectItem value="request_sent" className="uppercase text-[10px] tracking-widest font-medium">Request Sent</SelectItem>
            <SelectItem value="accepted" className="uppercase text-[10px] tracking-widest font-medium">Accepted</SelectItem>
            <SelectItem value="confirmed" className="uppercase text-[10px] tracking-widest font-medium">Confirmed</SelectItem>
            <SelectItem value="processed" className="uppercase text-[10px] tracking-widest font-medium">Processing</SelectItem>
            <SelectItem value="shipped" className="uppercase text-[10px] tracking-widest font-medium">Shipped</SelectItem>
            <SelectItem value="out-for-delivery" className="uppercase text-[10px] tracking-widest font-medium">Out for Delivery</SelectItem>
            <SelectItem value="delivered" className="uppercase text-[10px] tracking-widest font-medium">Delivered</SelectItem>
            <SelectItem value="rejected" className="uppercase text-[10px] tracking-widest font-medium">Rejected</SelectItem>
            <SelectItem value="cancelled" className="uppercase text-[10px] tracking-widest font-medium">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Combined My Orders Section */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-5 w-5 text-zinc-900" strokeWidth={1.5} />
          <h2 className="text-2xl font-serif tracking-tight text-zinc-900">Order History</h2>
          <Badge variant="secondary" className="font-mono text-[10px] tracking-widest uppercase bg-zinc-100 text-zinc-600 rounded-none border border-zinc-200 ml-2">
            {confirmedOrders.length + purchaseRequests.length}
          </Badge>
        </div>

        <div className="space-y-4">
          {[...confirmedOrders, ...purchaseRequests].length === 0 ? (
            <div className="p-12 text-center border border-zinc-200 bg-zinc-50">
              <Package className="h-10 w-10 mx-auto mb-4 text-zinc-300" strokeWidth={1} />
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                {searchTerm || statusFilter !== 'all' ? 'No orders found matching your criteria' : 'No orders yet'}
              </p>
            </div>
          ) : (
            [...confirmedOrders, ...purchaseRequests]
              .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
              .map((order) => {
                const isAwaitingApproval = order.status === 'request_sent';
                const isAccepted = order.status === 'accepted';
                const isRejected = order.status === 'rejected';
                const isPaid = order.paymentStatus === 'paid';

                const canRate = canRateOrder(order);
                const canReturn = canReturnOrder(order);
                const needsPayment = isAccepted && order.needsPaymentConfirmation;

                const isNegotiatingAgent = order.escrowStatus === 'negotiating_agent';
                const isAgentLocked = order.escrowStatus === 'locked' || order.escrowStatus === 'accepted'; // Based on how terms_accepted sets it

                return (
                  <div key={order.id} className="border border-zinc-200 bg-white group hover:border-zinc-300 transition-colors">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <Badge variant="outline" className="rounded-none border-zinc-300 text-zinc-600 bg-transparent text-[9px] uppercase tracking-widest font-mono">#{order.id.slice(0, 8)}</Badge>
                            <Badge className={`rounded-none text-[9px] uppercase tracking-widest font-bold border ${getStatusColor(order.status)}`} variant="default">
                              {getStatusLabel(order.status)}
                            </Badge>

                            {isPaid && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                <Check className="h-3 w-3 mr-1" strokeWidth={2} />
                                Paid
                              </Badge>
                            )}
                            {hasOrderReview(order) && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-white text-zinc-800 border border-zinc-200">
                                <Star className="h-3 w-3 mr-1" strokeWidth={2} />
                                Reviewed
                              </Badge>
                            )}
                            {isAwaitingApproval && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-zinc-50 text-zinc-600 border border-zinc-200">
                                <Clock className="h-3 w-3 mr-1" strokeWidth={2} />
                                Awaiting Approval
                              </Badge>
                            )}
                            {needsPayment && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-black text-white border border-black hover:bg-zinc-800 transition-colors">
                                <CreditCard className="h-3 w-3 mr-1" strokeWidth={2} />
                                Payment Required
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-red-50 text-red-600 border border-red-200">
                                <X className="h-3 w-3 mr-1" strokeWidth={2} />
                                Rejected
                              </Badge>
                            )}
                            {isNegotiatingAgent && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                <Shield className="h-3 w-3 mr-1" strokeWidth={2} />
                                Negotiating Escrow
                              </Badge>
                            )}
                            {isAgentLocked && (
                              <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-widest font-bold bg-black text-white hover:bg-zinc-800 border border-black">
                                <ShieldCheck className="h-3 w-3 mr-1" strokeWidth={2} />
                                Secure Trade Locked
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-serif text-2xl tracking-tight text-zinc-900 mb-2 truncate">{order.itemName}</h3>
                          <p className="text-[10px] uppercase tracking-widest font-medium text-zinc-500 mb-4">
                            {order.quantity} units × {formatPrice(order.unitPrice)}
                          </p>

                          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest font-medium text-zinc-400 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.orderDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3" />
                              {order.supplierName}
                            </div>
                            {order.estimatedDelivery && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3" />
                                Est. {formatDate(order.estimatedDelivery)}
                              </div>
                            )}
                          </div>

                          {isRejected && order.rejectionReason && (
                            <div className="mt-4 p-4 border border-zinc-200 bg-zinc-50">
                              <div className="flex items-center gap-2 text-red-600 text-[10px] uppercase tracking-widest font-bold">
                                <AlertCircle className="h-4 w-4" />
                                Rejection Reason: <span className="text-zinc-900 font-medium ml-2">{order.rejectionReason}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="font-serif text-2xl text-zinc-900 mb-1">{formatPrice(order.totalAmount)}</div>
                          <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">{order.quantity} items total</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-6 border-t border-zinc-100 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(order)}
                          className="h-10 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[9px] font-bold transition-all bg-white"
                        >
                          <Eye className="h-3 w-3 mr-2" strokeWidth={2} />
                          {['confirmed', 'processed', 'shipped', 'out-for-delivery', 'delivered'].includes(order.status) ? 'Track' : 'Details'}
                        </Button>

                        {canRate && (
                          <Button
                            variant={hasOrderReview(order) ? "outline" : "default"}
                            onClick={() => handleRateAndReview(order)}
                            className={`h-10 rounded-none uppercase tracking-[0.2em] text-[9px] font-bold transition-all ${hasOrderReview(order) ? 'border-zinc-200 text-zinc-600 hover:text-black bg-white' : 'bg-black text-white hover:bg-zinc-900 border border-black'}`}
                          >
                            <Star className="h-3 w-3 mr-2" strokeWidth={2} />
                            {hasOrderReview(order) ? 'Edit Review' : 'Rate & Review'}
                          </Button>
                        )}

                        {canReturn && (
                          <Button
                            variant="outline"
                            onClick={() => handleReturnOrder(order)}
                            className="h-10 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[9px] font-bold transition-all bg-white"
                          >
                            <RotateCcw className="h-3 w-3 mr-2" strokeWidth={2} />
                            Return
                          </Button>
                        )}

                        {needsPayment && (
                          <Button
                            variant="default"
                            onClick={() => handlePaymentConfirmation(order)}
                            className="h-10 rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[9px] font-bold transition-all border border-black"
                          >
                            <CreditCard className="h-3 w-3 mr-2" strokeWidth={2} />
                            Confirm Payment
                          </Button>
                        )}

                        {isAwaitingApproval && (
                          <Button
                            variant="outline"
                            onClick={() => handleCancelOrder(order)}
                            className="h-10 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[9px] font-bold transition-all bg-white"
                          >
                            <X className="h-3 w-3 mr-2" strokeWidth={2} />
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white border border-zinc-200 shadow-2xl rounded-none">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900">Order Details</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
                Order Reference Number: #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedOrder && (
            <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
              {/* Order Info */}
              <div className="border border-zinc-200">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-900">Order Information</h4>
                  <Badge className={`rounded-none text-[9px] uppercase tracking-widest font-bold border ${getStatusColor(selectedOrder.status)}`} variant="default">
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Item</span>
                      <p className="font-serif text-lg text-zinc-900">{selectedOrder.itemName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Supplier</span>
                      <p className="font-medium text-zinc-900">{selectedOrder.supplierName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Quantity/Price</span>
                      <p className="font-medium text-zinc-900">{selectedOrder.quantity} units @ {formatPrice(selectedOrder.unitPrice)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Total Amount</span>
                      <p className="font-serif text-xl text-zinc-900">{formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Payment Method</span>
                      <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">{selectedOrder.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-1">Order Date</span>
                      <p className="font-medium text-zinc-900">{formatDate(selectedOrder.orderDate)}</p>
                    </div>
                  </div>

                  {selectedOrder.deliveryAddress && (
                    <div className="mt-6 pt-6 border-t border-zinc-100">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-2">Delivery Address</span>
                      <p className="font-medium text-zinc-900 leading-relaxed max-w-lg">{selectedOrder.deliveryAddress}</p>
                    </div>
                  )}

                  {selectedOrder.specialInstructions && (
                    <div className="mt-6 pt-6 border-t border-zinc-100">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block mb-2">Special Instructions</span>
                      <p className="font-medium text-zinc-900 leading-relaxed bg-zinc-50 p-4 border border-zinc-200 mt-2">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Timeline */}
              <OrderTrackingTimeline
                currentStatus={selectedOrder.status}
                orderDate={selectedOrder.orderDate}
                estimatedDelivery={selectedOrder.estimatedDelivery}
                trackingNumber={selectedOrder.trackingNumber}
                layout="horizontal"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating & Review Dialog */}
      {selectedOrder && (
        <StunningRatingDialog
          open={showRatingReviewDialog}
          onOpenChange={setShowRatingReviewDialog}
          mode="buyer"
          orderId={selectedOrder.id}
          targets={{
            product: {
              id: selectedOrder.itemId,
              name: selectedOrder.itemName,
              image: undefined // Add logic to get image if available in order
            },
            supplier: {
              id: selectedOrder.supplierId,
              name: selectedOrder.supplierName
            }
          }}
          existingReviews={{
            productRating: getOrderReview(selectedOrder.id) as any, // Cast to any to avoid strict type mismatch for now
          }}
          onSubmit={async (data) => {
            handleReviewSubmit({
              orderId: selectedOrder.id,
              ...data
            });
            return Promise.resolve();
          }}
        />
      )}

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-white border border-zinc-200 rounded-none shadow-2xl">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900">Return Request</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
                Submit a return request for this order. Please provide a detailed reason.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedOrder && (
            <div className="p-8 space-y-8">
              <div className="p-4 border border-zinc-200 bg-white">
                <p className="font-serif text-xl text-zinc-900 mb-1">{selectedOrder.itemName}</p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-900 block mb-3">Reason for Return *</label>
                <Textarea
                  placeholder="PLEASE PROVIDE A DETAILED REASON FOR THE RETURN REQUEST..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={4}
                  className="rounded-none border-zinc-200 focus-visible:ring-black uppercase text-[10px] tracking-wider placeholder:text-zinc-400 p-4"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button
                  variant="outline"
                  onClick={() => setShowReturnDialog(false)}
                  className="rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold h-12 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReturnSubmit}
                  disabled={!returnReason.trim()}
                  className="rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[10px] font-bold h-12 px-6 border border-black"
                >
                  <RotateCcw className="h-4 w-4 mr-2" strokeWidth={2} />
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showPaymentConfirmation}
        onClose={() => setShowPaymentConfirmation(false)}
        order={selectedOrder as any}
      />
    </div>
  );
}
