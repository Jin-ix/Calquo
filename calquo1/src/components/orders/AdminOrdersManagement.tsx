import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Search, Eye, XCircle, Calendar, User, Package, DollarSign, Clock, AlertTriangle, Settings } from 'lucide-react';
import { OrderRequest } from './OrderDialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthProvider';

interface AdminOrdersManagementProps {
  orders: OrderRequest[];
  onUpdateOrderStatus: (orderId: string, status: OrderRequest['status'], additionalData?: Partial<OrderRequest>) => void;
}

interface OrderDetailsDialogProps {
  order: OrderRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelOrder: (orderId: string, remarks: string) => void;
  onEditOrder: (orderId: string, status: OrderRequest['status'], updates: Partial<OrderRequest>) => void;
  isSuperAdmin: boolean;
}

interface CancelOrderDialogProps {
  order: OrderRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, remarks: string) => void;
}

function CancelOrderDialog({ order, isOpen, onClose, onConfirm }: CancelOrderDialogProps) {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order || !remarks.trim()) {
      toast.error('Please provide remarks for cancellation');
      return;
    }

    if (remarks.trim().length < 10) {
      toast.error('Please provide detailed remarks (minimum 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(order.id, remarks.trim());
      setRemarks('');
      onClose();
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Permanently cancel this order with detailed remarks. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {order && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Order ID: {order.id}</p>
              <p className="text-sm text-muted-foreground">Item: {order.itemName}</p>
              <p className="text-sm text-muted-foreground">Current Status: <Badge variant="outline">{order.status}</Badge></p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="cancel-remarks">Cancellation Remarks *</Label>
            <Textarea
              id="cancel-remarks"
              placeholder="Please provide detailed reason for cancellation (minimum 10 characters)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {remarks.length}/200 characters
            </p>
          </div>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">Warning</p>
            <p className="text-xs text-destructive/80 mt-1">
              This action cannot be undone. The order will be permanently cancelled and all parties will be notified.
            </p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!remarks.trim() || remarks.length < 10 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditOrderDialogProps {
  order: OrderRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, status: OrderRequest['status'], updates: Partial<OrderRequest>) => void;
  isSuperAdmin: boolean;
}

function EditOrderDialog({ order, isOpen, onClose, onConfirm, isSuperAdmin }: EditOrderDialogProps) {
  const [status, setStatus] = useState<OrderRequest['status']>(order?.status || 'pending');
  const [remarks, setRemarks] = useState('');
  const [quantity, setQuantity] = useState(order?.quantity || 0);
  const [unitPrice, setUnitPrice] = useState(order?.unitPrice || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setQuantity(order.quantity);
      setUnitPrice(order.unitPrice || 0);
      setRemarks(order.adminRemarks || '');
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      const updates: Partial<OrderRequest> = { adminRemarks: remarks };
      if (isSuperAdmin) {
        updates.quantity = Number(quantity);
        updates.unitPrice = Number(unitPrice);
        updates.totalAmount = updates.quantity * updates.unitPrice;
      }
      await onConfirm(order.id, status, updates);
      onClose();
      toast.success('Order updated successfully');
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Order - {order?.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderRequest['status'])}
              className="w-full border rounded-md p-2"
            >
              <option value="request_sent">Request Sent</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="confirmed">Confirmed</option>
              <option value="processed">Processed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          {isSuperAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Admin Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add internal remarks..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailsDialog({ order, isOpen, onClose, onCancelOrder, onEditOrder, isSuperAdmin }: OrderDetailsDialogProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'agent_pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {order.id}
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of order information including buyer, seller, product details, and admin actions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Order Status</p>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus.replace('_', ' ').charAt(0).toUpperCase() + order.paymentStatus.replace('_', ' ').slice(1)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Buyer & Seller Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Buyer Information
                </h3>
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{order.buyerCompany}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="text-sm">{order.buyerEmail}</p>
                    <p className="text-sm">{order.buyerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Seller Information
                </h3>
                <div className="space-y-2 p-4 bg-green-50 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{order.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-sm">{order.supplierLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Details
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground">Item Name</p>
                  <p className="font-medium">{order.itemName}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium text-2xl">{order.quantity}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="font-medium text-lg">₹{(order.unitPrice || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </h3>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">₹{(order.totalAmount || 0).toLocaleString()}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.quantity} × ₹{(order.unitPrice || 0).toLocaleString()} = ₹{(order.totalAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <Separator />

            {/* Timeline Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Order Placed</span>
                  <span className="text-sm font-medium">
                    {new Date(order.orderDate).toLocaleString()}
                  </span>
                </div>
                {order.status === 'cancelled' && (
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-sm text-red-800">Order Cancelled</span>
                    <span className="text-sm font-medium text-red-800">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {order.status !== 'cancelled' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-destructive">Admin Actions</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditDialog(true)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Order
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CancelOrderDialog
        order={order}
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={onCancelOrder}
      />
      <EditOrderDialog
        order={order}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onConfirm={onEditOrder}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
}

export function AdminOrdersManagement({ orders, onUpdateOrderStatus }: AdminOrdersManagementProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      completed: orders.filter(o => o.status === 'completed').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  const handleViewOrder = (order: OrderRequest) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCancelOrder = (orderId: string, remarks: string) => {
    onUpdateOrderStatus(orderId, 'cancelled', { adminRemarks: remarks });
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleEditOrder = (orderId: string, status: OrderRequest['status'], updates: Partial<OrderRequest>) => {
    onUpdateOrderStatus(orderId, status, updates);
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">View and manage all orders in the system</p>
        </div>
      </div>

      {/* Order Overview Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Order Activity
          </CardTitle>
          <CardDescription>
            Total Orders: 2,847 | Pending: 156 | Processing: 89 | Disputed: 12
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">ORD-2025-3421</span>
                <Badge variant="secondary">Pending Approval</Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">₹2.8L</div>
                <div className="text-xs text-muted-foreground">Banarasi Silk Weavers</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">ORD-2025-3420</span>
                <Badge variant="default">In Production</Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">₹1.5L</div>
                <div className="text-xs text-muted-foreground">Kerala Cotton Mills</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">ORD-2025-3419</span>
                <Badge variant="outline">Quality Check</Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">₹95K</div>
                <div className="text-xs text-muted-foreground">Rajasthan Handloom Co-op</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">ORD-2025-3418</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Dispatch Ready</Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">₹3.2L</div>
                <div className="text-xs text-muted-foreground">Mumbai Textile Hub</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by ID, item name, buyer, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No orders found matching your search.' : 'No orders found.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium truncate">{order.itemName}</p>
                        <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.buyerCompany}</p>
                        <p className="text-xs text-muted-foreground">Buyer</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.supplierName}</p>
                        <p className="text-xs text-muted-foreground">Supplier</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(order.totalAmount || 0).toLocaleString()}</p>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        onCancelOrder={handleCancelOrder}
        onEditOrder={handleEditOrder}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
