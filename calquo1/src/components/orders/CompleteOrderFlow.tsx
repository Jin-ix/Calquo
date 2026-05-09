import React, { useState } from 'react';
import { OrderTrackingPage } from './OrderTrackingPage';
import { LogisticsReselectionModal } from './LogisticsReselectionModal';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { RazorpayCheckout } from '../payments/RazorpayCheckout';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { toast } from 'sonner';

interface CompleteOrderFlowProps {
  requestId: string;
  request?: PurchaseRequest;
  onOrderComplete?: () => void;
}

export function CompleteOrderFlow({ 
  requestId, 
  request: initialRequest,
  onOrderComplete 
}: CompleteOrderFlowProps) {
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showRazorpayCheckout, setShowRazorpayCheckout] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PurchaseRequest | null>(initialRequest || null);

  const handleReselectLogistics = () => {
    setShowLogisticsModal(true);
  };

  const handleProceedToPayment = () => {
    setShowPaymentSelector(true);
  };

  const handlePaymentMethodSelect = (method: 'razorpay' | 'upi' | 'card' | 'netbanking') => {
    setShowPaymentSelector(false);
    
    // For now, all methods go through Razorpay
    // In production, you might have separate flows for each
    setShowRazorpayCheckout(true);
  };

  const handlePaymentSuccess = async (
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    try {
      // Complete payment via purchaseService
      await purchaseService.completePayment(requestId, paymentId, 'direct');
      
      toast.success('Payment successful! Your order has been confirmed.');
      setShowRazorpayCheckout(false);
      
      // Call onOrderComplete callback if provided
      if (onOrderComplete) {
        onOrderComplete();
      }
    } catch (error: any) {
      console.error('Error completing payment:', error);
      toast.error('Payment successful but order confirmation failed. Please contact support.');
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
    setShowRazorpayCheckout(false);
  };

  const handlePaymentCancel = () => {
    setShowRazorpayCheckout(false);
    toast.info('Payment cancelled');
  };

  // If we have the request data and showing Razorpay
  if (showRazorpayCheckout && currentRequest) {
    const orderDetails = {
      id: currentRequest.id,
      items: currentRequest.items.map(item => ({
        name: `${currentRequest.stockName} - ${item.colorId && item.sizeId ? `${item.sizeId} • ${item.colorId}` : item.combinationId}`,
        quantity: item.quantity,
        price: item.pricePerUnit
      })),
      totalAmount: currentRequest.totalAmount,
      currency: 'INR'
    };

    return (
      <RazorpayCheckout
        orderDetails={orderDetails}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <>
      <OrderTrackingPage
        requestId={requestId}
        onReselectLogistics={handleReselectLogistics}
        onProceedToPayment={handleProceedToPayment}
      />

      <LogisticsReselectionModal
        open={showLogisticsModal}
        onClose={() => setShowLogisticsModal(false)}
        requestId={requestId}
        onSuccess={() => {
          toast.success('Logistics agent updated. Waiting for new approval.');
          setShowLogisticsModal(false);
        }}
      />

      {currentRequest && (
        <PaymentMethodSelector
          open={showPaymentSelector}
          onClose={() => setShowPaymentSelector(false)}
          request={currentRequest}
          onSelectMethod={handlePaymentMethodSelect}
        />
      )}
    </>
  );
}
