import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useAuth } from '../auth/AuthProvider';
import { useOrders, OrderRequest } from '../context/OrderProvider';
import { PatternDisplayComponent } from '../stock/PatternDisplayComponent';
import { 
  Package, 
  Palette, 
  Ruler, 
  Grid, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  User,
  MapPin,
  CreditCard,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedOrderManagementProps {
  userRole: 'supplier' | 'financial_agent';
  supplierName?: string;
}

interface OrderCombination {
  combinationId: string;
  colorId?: string;
  sizeId?: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export function EnhancedOrderManagement({ userRole, supplierName }: EnhancedOrderManagementProps) {
  const { user } = useAuth();
  const { orders, acceptOrder, rejectOrder, getOrdersForSupplier } = useOrders();
  
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get relevant orders based on user role
  const relevantOrders = userRole === 'supplier' && supplierName
    ? getOrdersForSupplier(supplierName)
    : userRole === 'financial_agent'
    ? orders.filter(order => 
        order.status === 'accepted' && 
        order.paymentStatus === 'payment_required' &&
        order.selectedCombinations && 
        order.selectedCombinations.length > 0
      )
    : [];

  const getStockTypeLabel = (itemSetType?: string) => {
    switch (itemSetType) {
      case 'set_of_pattern':
        return 'Set of Pattern';
      case 'set_of_sizes':
        return 'Set of Sizes';
      case 'flexible':
        return 'Flexible Selection';
      default:
        return 'Standard Order';
    }
  };

  const getStockTypeIcon = (itemSetType?: string) => {
    switch (itemSetType) {
      case 'set_of_pattern':
        return <Palette className="h-4 w-4" />;
      case 'set_of_sizes':
        return <Ruler className="h-4 w-4" />;
      case 'flexible':
        return <Grid className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const parseOrderCombinations = (order: OrderRequest): OrderCombination[] => {
    if (!order.selectedCombinations) return [];

    return order.selectedCombinations.map(combo => ({
      combinationId: combo.combinationId,
      colorId: combo.colorId,
      sizeId: combo.sizeId,
      colorName: combo.colorId ? `Color ${combo.colorId.slice(-3)}` : 'Standard',
      sizeName: combo.sizeId ? `Size ${combo.sizeId.slice(-2)}` : 'Standard',
      quantity: combo.quantity,
      pricePerUnit: combo.pricePerUnit,
      totalPrice: combo.quantity * combo.pricePerUnit
    }));
  };

  const handleViewDetails = (order: OrderRequest) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleAction = (order: OrderRequest, action: 'accept' | 'reject') => {
    setSelectedOrder(order);
    setActionType(action);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    
    try {
      if (actionType === 'accept') {
        acceptOrder(selectedOrder.id);
        toast.success('Order accepted successfully');
      } else {
        if (!rejectionReason.trim()) {
          toast.error('Please provide a rejection reason');
          return;
        }
        rejectOrder(selectedOrder.id, rejectionReason);
        toast.success('Order rejected');
      }
      
      setActionDialogOpen(false);
      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to process order action');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOrderCombinations = (order: OrderRequest) => {
    const combinations = parseOrderCombinations(order);
    
    if (combinations.length === 0) {
      return (
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Standard order: {order.quantity} × {order.itemName}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {combinations.map((combo, index) => (
          <div key={combo.combinationId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{combo.sizeName}</Badge>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: combo.colorId ? '#' + combo.colorId.slice(-6) : '#94a3b8' }}
                />
                <span className="text-sm">{combo.colorName}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {combo.quantity} × ₹{combo.pricePerUnit} = ₹{combo.totalPrice}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'request_sent':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Pending Review</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-300">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">Rejected</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Confirmed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderDetailsDialog = () => {
    if (!selectedOrder) return null;

    const combinations = parseOrderCombinations(selectedOrder);

    return (
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Order Details - {selectedOrder.id}
            </DialogTitle>
            <DialogDescription>
              View complete order information, status updates, and manage order actions.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-6">
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Buyer</span>
                    </div>
                    <p className="font-medium">{selectedOrder.buyerCompany}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.buyerEmail}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Product</span>
                    </div>
                    <p className="font-medium">{selectedOrder.itemName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStockTypeIcon(selectedOrder.itemSetType)}
                      <span className="text-sm text-muted-foreground">
                        {getStockTypeLabel(selectedOrder.itemSetType)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Order Value</span>
                    </div>
                    <p className="text-xl font-bold">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.quantity} total items
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Status */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ordered on {new Date(selectedOrder.orderDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              {/* Selected Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderOrderCombinations(selectedOrder)}
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.specialInstructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  const renderActionDialog = () => {
    if (!selectedOrder) return null;

    return (
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'accept' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'accept' ? 'Accept Order' : 'Reject Order'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' 
                ? 'Confirm that you can fulfill this order and proceed with production.'
                : 'Provide a reason for rejecting this order request.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-medium">{selectedOrder.itemName}</p>
              <p className="text-sm text-muted-foreground">
                Order ID: {selectedOrder.id}
              </p>
              <p className="text-sm text-muted-foreground">
                Total: ₹{selectedOrder.totalAmount.toLocaleString()}
              </p>
            </div>

            {actionType === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeAction} 
                disabled={isProcessing || (actionType === 'reject' && !rejectionReason.trim())}
                variant={actionType === 'accept' ? 'default' : 'destructive'}
              >
                {isProcessing ? 'Processing...' : actionType === 'accept' ? 'Accept Order' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {userRole === 'supplier' ? 'Incoming Orders' : 'Payment Approvals'}
        </h2>
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          {relevantOrders.length} {userRole === 'supplier' ? 'Orders' : 'Pending'}
        </Badge>
      </div>

      {relevantOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {userRole === 'supplier' ? 'incoming orders' : 'pending approvals'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {relevantOrders.map(order => {
            const combinations = parseOrderCombinations(order);
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{order.itemName}</h3>
                        {order.itemSetType && (
                          <div className="flex items-center gap-1">
                            {getStockTypeIcon(order.itemSetType)}
                            <Badge variant="secondary" className="text-xs">
                              {getStockTypeLabel(order.itemSetType)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order ID: {order.id} • From: {order.buyerCompany}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{order.totalAmount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{order.quantity} items</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Quick preview of combinations */}
                  {combinations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Selected Combinations:</p>
                      <div className="flex flex-wrap gap-2">
                        {combinations.slice(0, 3).map((combo, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {combo.sizeName} - {combo.colorName} (×{combo.quantity})
                          </Badge>
                        ))}
                        {combinations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{combinations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {userRole === 'supplier' && order.status === 'request_sent' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleAction(order, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleAction(order, 'accept')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {renderDetailsDialog()}
      {renderActionDialog()}
    </div>
  );
}
