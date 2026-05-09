import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { RazorpayCheckout } from '../payments/RazorpayCheckout';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Package,
  MapPin,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { updateDocument, addDocument } from '../../utils/firebase/firestore';

export interface CheckoutItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  sellerId?: string;
  seller_name?: string;
}

export interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  orderId?: string;
  deliveryAddress?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  orderId,
  deliveryAddress,
  onSuccess,
  onCancel
}: CheckoutDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [paymentId, setPaymentId] = useState<string>('');

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + gst;

  // Handle payment success
  const handlePaymentSuccess = async (
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    try {
      console.log('✅ Payment successful:', {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        signature: razorpaySignature
      });

      setPaymentId(razorpayPaymentId);

      // Update order status in Firestore
      if (orderId) {
        await updateDocument('orders', orderId, {
          payment_status: 'paid',
          status: 'confirmed',
          payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log(`✅ Order ${orderId} updated to 'paid' status`);
      } else {
        // Create new order if no orderId provided
        const newOrderId = await addDocument('orders', {
          buyerId: user?.email || '',
          buyer_name: user?.businessName || user?.fullName || '',
          items: items.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            sellerId: item.sellerId,
            seller_name: item.seller_name
          })),
          subtotal,
          gst_amount: gst,
          total_amount: total,
          delivery_address: deliveryAddress || '',
          payment_status: 'paid',
          status: 'confirmed',
          payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        console.log(`✅ New order created: ${newOrderId}`);
      }

      // Store payment record in payments subcollection
      await addDocument('payments', {
        payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        order_id: orderId || 'new_order',
        amount: total,
        currency: 'INR',
        payment_method: 'razorpay',
        status: 'captured',
        user_id: user?.email || '',
        user_name: user?.businessName || user?.fullName || '',
        items_count: items.length,
        createdAt: new Date().toISOString()
      });

      setStep('success');
      toast.success('Payment successful! Your order is confirmed.');

      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onOpenChange(false);
        setStep('review'); // Reset for next time
      }, 3000);

    } catch (error) {
      console.error('❌ Error updating order after payment:', error);
      toast.error('Payment successful but failed to update order. Please contact support.');
    }
  };

  // Handle payment failure
  const handlePaymentFailure = (error: any) => {
    console.error('❌ Payment failed:', error);
    toast.error(`Payment failed: ${error.description || 'Unknown error'}`);
    setStep('review');
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
    setStep('review');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <ShoppingCart className="h-6 w-6 text-teal-600" />
                Review Your Order
              </DialogTitle>
              <DialogDescription>
                Review your items and proceed to secure payment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Customer Details */}
              {user && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-teal-900">
                    <User className="h-4 w-4" />
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-teal-700">Name</p>
                      <p className="font-medium text-teal-900">{user.businessName || user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-teal-700">Email</p>
                      <p className="font-medium text-teal-900">{user.email}</p>
                    </div>
                    {user.phoneNumber && (
                      <div>
                        <p className="text-teal-700">Phone</p>
                        <p className="font-medium text-teal-900">{user.phoneNumber}</p>
                      </div>
                    )}
                    {deliveryAddress && (
                      <div className="col-span-2">
                        <p className="text-teal-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Delivery Address
                        </p>
                        <p className="font-medium text-teal-900">{deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.seller_name && (
                          <p className="text-sm text-muted-foreground">
                            Seller: {item.seller_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-muted-foreground">per unit</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold text-teal-600">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span className="font-medium">{formatCurrency(gst)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-teal-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setStep('payment')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'payment' && (
          <>
            <DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('review')}
                className="w-fit mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Review
              </Button>
              <DialogTitle className="text-2xl">Complete Payment</DialogTitle>
              <DialogDescription>
                Choose your preferred payment method
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RazorpayCheckout
                orderDetails={{
                  id: orderId,
                  items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })),
                  totalAmount: total,
                  currency: 'INR'
                }}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                onCancel={() => setStep('review')}
              />
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Payment Successful!</DialogTitle>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Order Confirmed!</h3>
                <p className="text-muted-foreground">
                  Your payment of {formatCurrency(total)} has been processed successfully.
                </p>
                {paymentId && (
                  <p className="text-sm text-muted-foreground">
                    Payment ID: <span className="font-mono font-medium">{paymentId}</span>
                  </p>
                )}
              </div>

              <Alert className="border-green-300 bg-green-50 max-w-md mx-auto">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Order confirmation has been sent to your email. You can track your order in the Orders section.
                </AlertDescription>
              </Alert>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    onOpenChange(false);
                    setStep('review');
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
