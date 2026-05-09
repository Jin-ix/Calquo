import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Star,
  Package,
  Calendar,
  MapPin,
  Edit,
  Check,
  Clock,
  User,
  Building2,
  Camera,
  MessageSquare,
  Award,
  Eye
} from 'lucide-react';

import { useAuth } from '../auth/AuthProvider';
import { RatingSubmission, InteractiveRating, Rating } from '../rating/RatingSystem';
import { StunningRatingDialog } from '../rating/StunningRatingDialog';
import { toast } from 'sonner';

interface OrderRequest {
  id: string;
  itemName: string;
  stockName?: string;
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
  trackingNumber?: string;
  productId?: string;
  supplierId?: string;
}

interface RatingSubmissionData {
  productRating?: number;
  productReview?: string;
  supplierRating?: number;
  supplierReview?: string;
  images?: File[];
}

interface OrdersWithRatingsProps {
  title: string;
  orders: OrderRequest[];
  showSupplierColumn?: boolean;
  showBuyerColumn?: boolean;
  ratings: Rating[];
  onRatingSubmit: (rating: Omit<Rating, 'id' | 'createdDate'>) => void;
  onViewDetails?: (order: OrderRequest) => void;
}

export const OrdersWithRatings: React.FC<OrdersWithRatingsProps> = ({
  title,
  orders,
  showSupplierColumn = false,
  showBuyerColumn = false,
  ratings,
  onRatingSubmit,
  onViewDetails
}) => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [ratingData, setRatingData] = useState<RatingSubmissionData>({});

  // Filter orders that can be rated (delivered orders)
  const ratableOrders = useMemo(() => {
    return orders.filter(order => order.status === 'delivered');
  }, [orders]);

  // Check if order has been rated
  const hasRating = (orderId: string, type: 'product' | 'supplier') => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !user) return false;

    const targetId = type === 'product' ? order.productId || order.id : order.supplierId || order.supplierName;
    const targetType = type === 'product' ? 'item' : 'supplier';

    return ratings.some(rating =>
      rating.userId === user.email &&
      rating.targetId === targetId &&
      rating.targetType === targetType
    );
  };

  // Get existing rating
  const getExistingRating = (orderId: string, type: 'product' | 'supplier') => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !user) return undefined;

    const targetId = type === 'product' ? order.productId || order.id : order.supplierId || order.supplierName;
    const targetType = type === 'product' ? 'item' : 'supplier';

    return ratings.find(rating =>
      rating.userId === user.email &&
      rating.targetId === targetId &&
      rating.targetType === targetType
    );
  };

  // Check if rating can be edited (within 7 days)
  const canEditRating = (rating: Rating): boolean => {
    const ratingDate = new Date(rating.createdDate);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - ratingDate.getTime()) / (1000 * 3600 * 24));
    return daysDifference <= 7;
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
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'confirmed': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRatingSubmit = () => {
    if (!selectedOrder || !user) return;

    // Submit product rating if provided
    if (ratingData.productRating && ratingData.productRating > 0) {
      onRatingSubmit({
        userId: user.email,
        userName: user.name,
        userCompany: user.company,
        targetId: selectedOrder.productId || selectedOrder.id,
        targetType: 'item',
        rating: ratingData.productRating,
        rating: ratingData.productRating,
        review: ratingData.productReview?.trim() || undefined,
        images: ratingData.images
      });
    }

    // Submit supplier rating if provided
    if (ratingData.supplierRating && ratingData.supplierRating > 0) {
      onRatingSubmit({
        userId: user.email,
        userName: user.name,
        userCompany: user.company,
        targetId: selectedOrder.supplierId || selectedOrder.supplierName,
        targetType: 'supplier',
        rating: ratingData.supplierRating,
        targetType: 'supplier',
        rating: ratingData.supplierRating,
        review: ratingData.supplierReview?.trim() || undefined
      });
    }

    // Reset and close
    setRatingData({});
    setRatingDialog(false);
    setSelectedOrder(null);
    toast.success('Rating submitted successfully!');
  };

  const openRatingDialog = (order: OrderRequest) => {
    setSelectedOrder(order);

    // Pre-fill existing ratings
    const existingProductRating = getExistingRating(order.id, 'product');
    const existingSupplierRating = getExistingRating(order.id, 'supplier');

    setRatingData({
      productRating: existingProductRating?.rating || 0,
      productReview: existingProductRating?.review || '',
      supplierRating: existingSupplierRating?.rating || 0,
      supplierReview: existingSupplierRating?.review || ''
    });

    setRatingDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{title}</h1>
          <p className="text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? 's' : ''} • {ratableOrders.length} available for rating
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const hasProductRating = hasRating(order.id, 'product');
            const hasSupplierRating = hasRating(order.id, 'supplier');
            const canRate = order.status === 'delivered' && user?.role === 'retailer';
            const existingProductRating = getExistingRating(order.id, 'product');
            const existingSupplierRating = getExistingRating(order.id, 'supplier');

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{order.id}</Badge>
                        <Badge className={getStatusColor(order.status)} variant="default">
                          {order.status}
                        </Badge>
                        {order.paymentStatus === 'paid' && (
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{order.itemName}</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        {order.quantity} units × {formatPrice(order.unitPrice)} = {formatPrice(order.totalAmount)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.orderDate)}
                        </div>
                        {showSupplierColumn && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {order.supplierName}
                          </div>
                        )}
                        {showBuyerColumn && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {order.buyerCompany}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}

                      {canRate && (
                        <Button
                          variant={hasProductRating || hasSupplierRating ? "outline" : "default"}
                          size="sm"
                          disabled={hasProductRating || hasSupplierRating}
                          onClick={() => !hasProductRating && !hasSupplierRating && openRatingDialog(order)}
                          className={hasProductRating || hasSupplierRating ? "gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200" : "gap-1"}
                        >
                          {hasProductRating || hasSupplierRating ? (
                            <>
                              <Check className="h-4 w-4" />
                              Rated
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4" />
                              Rate Order
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Rating Status */}
                  {canRate && (hasProductRating || hasSupplierRating) && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4 text-sm">
                        {hasProductRating && existingProductRating && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Product:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < existingProductRating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            {canEditRating(existingProductRating) && (
                              <Badge variant="secondary" className="text-xs">Editable</Badge>
                            )}
                          </div>
                        )}
                        {hasSupplierRating && existingSupplierRating && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Supplier:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < existingSupplierRating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            {canEditRating(existingSupplierRating) && (
                              <Badge variant="secondary" className="text-xs">Editable</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rating Dialog */}
      <StunningRatingDialog
        open={ratingDialog}
        onOpenChange={setRatingDialog}
        mode="buyer"
        orderId={selectedOrder?.id || ''}
        targets={{
          product: selectedOrder ? { id: selectedOrder.item?.id || selectedOrder.productId || selectedOrder.id, name: selectedOrder.stockName || selectedOrder.itemName } : undefined,
          supplier: selectedOrder ? { id: selectedOrder.sellerId || selectedOrder.supplierId || '', name: selectedOrder.sellerName || selectedOrder.supplierName } : undefined
        }}
        existingReviews={{
          productRating: selectedOrder ? getExistingRating(selectedOrder.id, 'item') as any : undefined,
          supplierRating: selectedOrder ? getExistingRating(selectedOrder.id, 'supplier') as any : undefined
        }}
        onSubmit={async (data) => {
          // Flatten the data for the existing onRatingSubmit structure if needed,
          // or ideally, update onRatingSubmit to handle the new format.
          // For now, we will make individual calls for product and supplier as that's what the existing handler likely expects 
          // or we can adapt the handler. 

          // Actually, let's look at the existing onRatingSubmit signature in the file.
          // It takes (data: any).

          if (data.productRating) {
            await onRatingSubmit({
              ...data.productRating,
              ...data.productRating,
              orderId: selectedOrder?.id,
              targetType: 'item',
              images: data.images // Pass images from dialog to handler
            });
          }
          if (data.supplierRating) {
            await onRatingSubmit({
              ...data.supplierRating,
              orderId: selectedOrder?.id,
              targetType: 'supplier'
            });
          }
        }}
      />
    </div>
  );
};
