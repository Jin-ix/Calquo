import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { PaymentInterface } from '../payments/PaymentInterface';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  Calendar,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';
import { MyOrder } from '../context/OrderProvider';
import { useOrders } from '../context/OrderProvider';
import { toast } from 'sonner';

interface PaymentConfirmationDialogProps {
  order: MyOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentConfirmationDialog({ order, isOpen, onClose }: PaymentConfirmationDialogProps) {
  const { confirmAndPay, cancelOrder } = useOrders();
  const [showPaymentInterface, setShowPaymentInterface] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmAndPay = () => {
    setShowPaymentInterface(true);
  };

  const handlePaymentComplete = async (orderId: string, success: boolean, paymentMethod: string) => {
    setIsProcessing(true);

    try {
      if (success) {
        confirmAndPay(orderId, paymentMethod);
        toast.success('Payment successful! Your order has been confirmed and is now being processed.');
        onClose();
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred during payment processing.');
    } finally {
      setIsProcessing(false);
      setShowPaymentInterface(false);
    }
  };

  const handleCancelOrder = () => {
    cancelOrder(order.id);
    onClose();
  };

  // If showing payment interface, render that instead
  if (showPaymentInterface) {
    return (
      <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Complete your payment to confirm order #{order.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <PaymentInterface
              order={{
                id: order.id,
                stockName: order.itemName,
                quantity: order.quantity,
                pricePerUnit: order.unitPrice,
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus === 'paid' ? 'completed' : 'pending'
              }}
              onPaymentComplete={(orderId, success, paymentMethod) =>
                handlePaymentComplete(orderId, success, paymentMethod || 'unknown')
              }
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPaymentInterface(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Back to Confirmation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white border border-zinc-200 shadow-2xl rounded-none">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-black" strokeWidth={1.5} />
              Order Accepted - Payment Required
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
              Great news! Your order has been accepted by the supplier. Please confirm and proceed with payment to finalize your purchase.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Success Banner */}
          <div className="border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-5 w-5 text-black mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <h3 className="font-serif text-xl tracking-tight text-zinc-900">
                  Order Accepted by {order.supplierName}
                </h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {order.acceptanceDate ? `Accepted on ${formatDate(order.acceptanceDate)}` : 'Recently Accepted'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
              <h4 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900">
                <Package className="h-4 w-4" strokeWidth={1.5} />
                Order Summary
              </h4>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-none border-zinc-300 text-zinc-600 bg-transparent text-[9px] uppercase tracking-widest font-mono">#{order.id.slice(0, 8)}</Badge>
                <Badge
                  className="rounded-none bg-black text-white hover:bg-zinc-800 text-[9px] uppercase tracking-widest font-bold border border-black"
                >
                  <Clock className="h-3 w-3 mr-1.5" strokeWidth={2} />
                  Payment Required
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Product</span>
                <span className="font-serif text-lg tracking-tight text-zinc-900">{order.itemName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Supplier</span>
                <span className="font-medium text-zinc-900">{order.supplierName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Quantity</span>
                <span className="font-medium text-zinc-900">{order.quantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Price per unit</span>
                <span className="font-medium text-zinc-900">{formatPrice(order.unitPrice)}</span>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-900">Total Amount</span>
                <span className="font-serif text-2xl text-zinc-900">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            {order.deliveryAddress && (
              <div className="pt-6 mt-6 border-t border-zinc-100">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Delivery Address</p>
                    <p className="font-medium text-zinc-900 max-w-sm">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-zinc-100">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Order Date</p>
                  <p className="font-medium text-zinc-900">{formatDate(order.orderDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="border border-zinc-200 bg-zinc-50 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="flex items-start gap-4 flex-1">
              <AlertCircle className="h-5 w-5 text-black mt-0.5" strokeWidth={1.5} />
              <div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-900">Next Steps</h3>
                <p className="text-sm font-medium text-zinc-600 mt-1 max-w-sm">
                  Complete your payment to confirm this order. Once payment is successful, your order will be processed and prepared for shipment.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleCancelOrder}
                className="h-12 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold px-6 whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" strokeWidth={2} />
                Cancel Order
              </Button>
              <Button
                onClick={handleConfirmAndPay}
                className="h-12 rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[10px] font-bold px-8 border border-black whitespace-nowrap"
              >
                <CreditCard className="h-4 w-4 mr-2" strokeWidth={2} />
                Pay {formatPrice(order.totalAmount)}
              </Button>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 text-center pt-4">
            <span className="mr-2">🔒</span> Your payment information is secure and encrypted.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
