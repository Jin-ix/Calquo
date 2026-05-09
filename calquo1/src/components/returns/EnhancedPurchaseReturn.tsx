import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  RotateCcw, 
  Package, 
  Calendar as CalendarIcon, 
  Upload,
  AlertCircle,
  Check,
  Clock,
  XCircle,
  Camera,
  FileText,
  User,
  Building2,
  MapPin,
  Eye,
  Filter
} from 'lucide-react';

import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { format } from 'date-fns';

interface OrderRequest {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyerCompany: string;
  supplierName: string;
  supplierType: 'manufacturer' | 'trader';
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress?: string;
  estimatedDelivery?: string;
  productId?: string;
  category?: string;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  orderDetails: OrderRequest;
  returnQuantity: number;
  returnReason: string;
  customReason?: string;
  returnDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  images?: string[];
  refundAmount: number;
  processingNotes?: string;
  approvedDate?: string;
  completedDate?: string;
}

interface EnhancedPurchaseReturnProps {
  orders: OrderRequest[];
  returns: ReturnRequest[];
  onInitiateReturn: (returnData: Omit<ReturnRequest, 'id' | 'status' | 'returnDate'>) => void;
  onViewOrderDetails?: (order: OrderRequest) => void;
}

const RETURN_REASONS = [
  'Defective/Damaged Product',
  'Wrong Item Received',
  'Size/Color Mismatch',
  'Quality Issues',
  'Not as Described',
  'Change of Mind',
  'Duplicate Order',
  'Other'
];

const RETURN_POLICY_DAYS = 15; // Return policy period in days

export const EnhancedPurchaseReturn: React.FC<EnhancedPurchaseReturnProps> = ({
  orders,
  returns,
  onInitiateReturn,
  onViewOrderDetails
}) => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'eligible' | 'history'>('eligible');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter eligible orders for return (delivered orders within return policy)
  const eligibleOrders = useMemo(() => {
    const now = new Date();
    
    return orders.filter(order => {
      // Must be delivered
      if (order.status !== 'delivered') return false;
      
      // Must be within return policy period
      const orderDate = new Date(order.orderDate);
      const daysDifference = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
      if (daysDifference > RETURN_POLICY_DAYS) return false;
      
      // Must not already have a return request
      const hasExistingReturn = returns.some(returnReq => returnReq.orderId === order.id);
      if (hasExistingReturn) return false;
      
      // Must be buyer's order (for retailers)
      if (user?.role === 'retailer' && order.buyerCompany !== user.company) return false;
      
      return true;
    });
  }, [orders, returns, user]);

  // Filter return history
  const filteredReturns = useMemo(() => {
    let filtered = returns;
    
    // Filter by user's orders only
    if (user?.role === 'retailer') {
      filtered = filtered.filter(returnReq => 
        returnReq.orderDetails.buyerCompany === user.company
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(returnReq => returnReq.status === statusFilter);
    }
    
    return filtered;
  }, [returns, user, statusFilter]);

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

  const getDaysUntilExpiry = (orderDate: string): number => {
    const now = new Date();
    const order = new Date(orderDate);
    const daysSinceOrder = Math.floor((now.getTime() - order.getTime()) / (1000 * 3600 * 24));
    return RETURN_POLICY_DAYS - daysSinceOrder;
  };

  const getReturnStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getReturnStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum 5MB per image.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      return true;
    });
    
    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = () => {
    if (!selectedOrder || !returnReason || returnQuantity < 1) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (returnQuantity > selectedOrder.quantity) {
      toast.error(`Cannot return more than ${selectedOrder.quantity} items`);
      return;
    }

    // Calculate partial refund based on return quantity
    const refundAmount = (selectedOrder.unitPrice * returnQuantity);

    const returnData = {
      orderId: selectedOrder.id,
      orderDetails: selectedOrder,
      returnQuantity,
      returnReason,
      customReason: returnReason === 'Other' ? customReason : undefined,
      refundAmount,
      images: images.map(img => URL.createObjectURL(img)) // In real app, upload to server
    };

    onInitiateReturn(returnData);
    
    // Reset form
    setReturnReason('');
    setCustomReason('');
    setReturnQuantity(1);
    setImages([]);
    setReturnDialog(false);
    setSelectedOrder(null);
    
    toast.success('Return request submitted successfully!');
  };

  const openReturnDialog = (order: OrderRequest) => {
    setSelectedOrder(order);
    setReturnQuantity(order.quantity); // Default to full quantity
    setReturnDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Purchase Returns</h1>
          <p className="text-muted-foreground">
            Manage your return requests and view return history
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('eligible')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'eligible' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Eligible Orders ({eligibleOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'history' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Return History ({filteredReturns.length})
        </button>
      </div>

      {/* Eligible Orders Tab */}
      {activeTab === 'eligible' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Eligible for Return
              </CardTitle>
              <CardDescription>
                Orders that can be returned within {RETURN_POLICY_DAYS} days of delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eligibleOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No orders eligible for return at this time
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Orders can be returned within {RETURN_POLICY_DAYS} days of delivery
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eligibleOrders.map((order) => {
                    const daysLeft = getDaysUntilExpiry(order.orderDate);
                    
                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">#{order.id}</Badge>
                                <Badge variant="default" className="bg-green-500">
                                  Delivered
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                </Badge>
                              </div>
                              
                              <h3 className="font-semibold mb-1">{order.itemName}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {order.quantity} units × {formatPrice(order.unitPrice)} = {formatPrice(order.totalAmount)}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  Delivered on {formatDate(order.orderDate)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4" />
                                  {order.supplierName}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {onViewOrderDetails && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => onViewOrderDetails(order)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openReturnDialog(order)}
                                className="gap-1"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Initiate Return
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Return History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Return History
                  </CardTitle>
                  <CardDescription>
                    Track the status of your return requests
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReturns.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' ? 'No return requests found' : `No ${statusFilter} returns found`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReturns.map((returnReq) => (
                    <Card key={returnReq.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Return #{returnReq.id}</Badge>
                              <Badge className={getReturnStatusColor(returnReq.status)} variant="default">
                                {getReturnStatusIcon(returnReq.status)}
                                <span className="ml-1 capitalize">{returnReq.status}</span>
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold mb-1">{returnReq.orderDetails.itemName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Order #{returnReq.orderId} • {returnReq.returnQuantity} item{returnReq.returnQuantity !== 1 ? 's' : ''} • {formatPrice(returnReq.refundAmount)} refund
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                Requested on {formatDate(returnReq.returnDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {returnReq.returnReason}
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                        
                        {returnReq.processingNotes && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">Note: </span>
                              {returnReq.processingNotes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Return Request Dialog */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate Return Request</DialogTitle>
            <DialogDescription>
              Complete the form below to request a return for your purchased items. Please provide accurate details to help us process your request quickly.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedOrder.itemName}</p>
                <p className="text-sm text-muted-foreground">
                  Order #{selectedOrder.id} • {selectedOrder.quantity} items ordered • {formatPrice(selectedOrder.unitPrice)} per item
                </p>
                <p className="text-sm text-muted-foreground">
                  Delivered on {formatDate(selectedOrder.orderDate)} • Total paid: {formatPrice(selectedOrder.totalAmount)}
                </p>
              </div>

              {/* Auto-filled Purchase Date */}
              <div>
                <Label>Purchase Date</Label>
                <Input 
                  value={formatDate(selectedOrder.orderDate)} 
                  disabled 
                  className="mt-1 bg-muted"
                />
              </div>

              {/* Return Quantity */}
              <div>
                <Label htmlFor="return-quantity">Number of Items to Return *</Label>
                <div className="mt-1">
                  <Input
                    id="return-quantity"
                    type="number"
                    min={1}
                    max={selectedOrder.quantity}
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Math.max(1, Math.min(selectedOrder.quantity, parseInt(e.target.value) || 1)))}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum: {selectedOrder.quantity} item{selectedOrder.quantity !== 1 ? 's' : ''} • 
                    Refund: {formatPrice(selectedOrder.unitPrice * returnQuantity)}
                  </p>
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <Label>Why are you returning this item? *</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Reason */}
              {returnReason === 'Other' && (
                <div>
                  <Label htmlFor="custom-reason">Please specify *</Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Please provide details about your return reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Image Upload */}
              <div>
                <Label>Upload Images (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload photos of damaged/incorrect items as proof
                </p>
                
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <Camera className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB each (max 5 images)
                    </p>
                  </label>

                  {/* Uploaded Images Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Return Policy Notice */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Return Policy</p>
                    <p className="text-yellow-700">
                      Items must be returned within {RETURN_POLICY_DAYS} days of delivery. 
                      You can return partial quantities from your order. 
                      Refund will be processed within 5-7 business days after approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReturnDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReturn}
                  disabled={!returnReason || (returnReason === 'Other' && !customReason.trim()) || returnQuantity < 1 || returnQuantity > selectedOrder.quantity}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Submit Return Request ({returnQuantity} item{returnQuantity !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
