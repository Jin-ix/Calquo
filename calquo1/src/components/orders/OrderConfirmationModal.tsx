import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Eye,
  ShoppingBag,
  Truck,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/imageUtils';

interface OrderConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  orderDetails: {
    orderNumber: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    deliveryAddress?: string;
    paymentMethod?: string;
    estimatedDelivery?: string;
    supplierName?: string;
    itemImage?: string;
  };
  onTrackOrder: () => void;
  onContinueShopping: () => void;
}

export function OrderConfirmationModal({
  open,
  onClose,
  orderDetails,
  onTrackOrder,
  onContinueShopping
}: OrderConfirmationModalProps) {
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show success animation when modal opens
  useEffect(() => {
    if (open) {
      setShowSuccessAnimation(true);
      // Auto-hide animation after a delay
      const timer = setTimeout(() => setShowSuccessAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleTrackOrderClick = () => {
    toast.success('Redirecting to My Orders...', {
      description: 'Your order will appear in real-time',
      duration: 2000,
    });
    setTimeout(() => {
      onTrackOrder();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-green-700">
            Order Placed Successfully!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Your order has been confirmed and will be processed shortly. You can track its progress or continue shopping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Order Number</span>
                <Badge variant="outline" className="font-mono">
                  {orderDetails.orderNumber}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-md border border-zinc-100 overflow-hidden shrink-0 bg-zinc-50">
                    {orderDetails.itemImage ? (
                      <img
                        src={resolveImageUrl(orderDetails.itemImage)}
                        alt={orderDetails.itemName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-zinc-300">
                        <Package className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{orderDetails.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {orderDetails.quantity} units × {formatPrice(orderDetails.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(orderDetails.totalAmount)}
                  </span>
                </div>

                {orderDetails.supplierName && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-5 w-5" /> {/* Spacer */}
                    <span className="text-muted-foreground">
                      Supplier: <span className="font-medium">{orderDetails.supplierName}</span>
                    </span>
                  </div>
                )}

                {orderDetails.paymentMethod && (
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Payment: <span className="font-medium capitalize">{orderDetails.paymentMethod.replace('-', ' ')}</span>
                    </span>
                  </div>
                )}

                {orderDetails.estimatedDelivery && (
                  <div className="flex items-center gap-3 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Expected delivery: <span className="font-medium">{formatDate(orderDetails.estimatedDelivery)}</span>
                    </span>
                  </div>
                )}

                {orderDetails.deliveryAddress && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">
                      {orderDetails.deliveryAddress}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Zap className={`h-4 w-4 ${showSuccessAnimation ? 'animate-pulse' : ''}`} />
              <span className="font-medium text-sm">Real-Time Order Updates</span>
            </div>
            <p className="text-xs text-green-600">
              Your order will automatically appear in "My Orders" immediately. Track your order status in real-time with live updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onContinueShopping}
              className="flex-1 gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
            <Button
              onClick={handleTrackOrderClick}
              className="flex-1 gap-2"
            >
              <Eye className="h-4 w-4" />
              Track Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
