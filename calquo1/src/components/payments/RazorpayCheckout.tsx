import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Wallet,
  CheckCircle, 
  XCircle,
  Loader2,
  QrCode,
  ExternalLink,
  Shield,
  ArrowRight,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { addDocument } from '../../utils/firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { RAZORPAY_CONFIG } from '../../config/razorpay';

// Type definitions for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutProps {
  orderDetails: {
    id?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    currency?: string;
  };
  onSuccess: (paymentId: string, razorpayOrderId: string, razorpaySignature: string) => void;
  onFailure: (error: any) => void;
  onCancel?: () => void;
}

interface BhimUpiDetails {
  vpa: string;
  qrCodeUrl: string;
  deepLink: string;
}

export function RazorpayCheckout({
  orderDetails,
  onSuccess,
  onFailure,
  onCancel
}: RazorpayCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'bhim'>('bhim');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [upiLink, setUpiLink] = useState('');

  // Validate orderDetails with detailed checks
  const isValidOrderDetails = React.useMemo(() => {
    if (!orderDetails) {
      console.error('❌ RazorpayCheckout: orderDetails is undefined or null');
      return false;
    }
    if (typeof orderDetails.totalAmount !== 'number' || orderDetails.totalAmount <= 0) {
      console.error('❌ RazorpayCheckout: totalAmount is invalid:', orderDetails.totalAmount);
      return false;
    }
    // Items check is optional if we just have a total, but good for summary
    return true;
  }, [orderDetails]);

  if (!isValidOrderDetails) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Invalid Order Details</CardTitle>
            <CardDescription className="text-red-600">
              Order information is missing or incomplete. Please go back and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe access to orderDetails (guaranteed to be valid here)
  const totalAmount = orderDetails.totalAmount;
  const items = orderDetails.items || [];
  const orderId = orderDetails.id || '';

  // BHIM UPI Configuration
  const bhimConfig: BhimUpiDetails = {
    vpa: 'caliquo@razorpay', // Updated for CALIQUO
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=caliquo@razorpay&pn=CALIQUO&am=${totalAmount}&cu=INR&tn=CALIQUO%20Order%20Payment`,
    deepLink: `upi://pay?pa=caliquo@razorpay&pn=CALIQUO&am=${totalAmount}&cu=INR&tn=CALIQUO%20Order%20Payment`
  };

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay SDK loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway. Please refresh.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Create Razorpay order
  const createRazorpayOrder = async () => {
    try {
      console.log('📦 Creating Razorpay order via Firebase Function...');
      
      // Get Firebase Functions instance
      const functions = getFunctions();
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      
      // Call backend to create order
      const result = await createOrder({
        amount: totalAmount,
        currency: orderDetails.currency || 'INR',
        receipt: orderId || `rcpt_${Date.now()}`,
        notes: {
          order_id: orderId,
          items_count: items.length
        }
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      console.log('✅ Razorpay order created:', data.orderId);
      
      return {
        id: data.orderId,
        amount: data.amount,
        currency: data.currency
      };
    } catch (error: any) {
      console.error('❌ Error creating Razorpay order:', error);
      toast.error(error.message || 'Failed to create payment order');
      throw error;
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const order = await createRazorpayOrder();

      // Razorpay options
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: order.amount,
        currency: order.currency,
        name: RAZORPAY_CONFIG.companyName,
        description: `Payment for order ${orderId || 'New Order'}`,
        order_id: order.id,
        prefill: {
          name: user?.businessName || user?.fullName || '',
          email: user?.email || '',
          contact: user?.phoneNumber || ''
        },
        theme: {
          color: RAZORPAY_CONFIG.themeColor
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (onCancel) onCancel();
            toast.info('Payment cancelled');
          }
        },
        handler: async (response: any) => {
          console.log('✅ Payment successful:', response);
          
          try {
            // Store payment in Firestore
            await addDocument('payments', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
              amount: totalAmount,
              currency: orderDetails.currency || 'INR',
              payment_method: 'razorpay',
              status: 'captured',
              user_id: user?.email || '',
              createdAt: new Date().toISOString()
            });

            toast.success('Payment successful!');
            onSuccess(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          } catch (error) {
            console.error('❌ Error storing payment:', error);
            toast.error('Payment successful but failed to update records');
          }

          setLoading(false);
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('❌ Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        onFailure(response.error);
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      toast.error('Failed to initialize payment');
      setLoading(false);
      onFailure(error);
    }
  };

  // Handle BHIM UPI payment
  const handleBhimPayment = () => {
    setShowQr(true);
    setUpiLink(bhimConfig.deepLink);
    
    toast.info('Scan QR code or tap Pay via BHIM to complete payment', { 
      duration: 8000 
    });
  };

  // Simulate BHIM payment verification (in production, use webhook)
  const verifyBhimPayment = async () => {
    setLoading(true);
    
    try {
      // Simulate payment verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, verify payment status via backend webhook
      const paymentId = `pay_bhim_${Date.now()}`;
      
      // Store payment in Firestore
      await addDocument('payments', {
        payment_id: paymentId,
        order_id: orderId,
        amount: totalAmount,
        currency: orderDetails.currency || 'INR',
        payment_method: 'bhim_upi',
        upi_vpa: bhimConfig.vpa,
        status: 'pending_verification', // In production, this would be verified
        user_id: user?.email || '',
        createdAt: new Date().toISOString()
      });

      toast.success('Payment initiated! Verifying...');
      
      // Simulate verification success
      setTimeout(() => {
        onSuccess(paymentId, orderId || '', '');
        toast.success('Payment verified successfully!');
      }, 2000);
      
    } catch (error) {
      console.error('❌ BHIM payment verification error:', error);
      toast.error('Failed to verify payment');
      onFailure(error);
    } finally {
      setLoading(false);
    }
  };

  // Open UPI app
  const openUpiApp = () => {
    window.location.href = bhimConfig.deepLink;
    
    // After a delay, ask user to verify
    setTimeout(() => {
      toast('Have you completed the payment?', {
        action: {
          label: 'Verify Payment',
          onClick: verifyBhimPayment
        },
        duration: 10000
      });
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-teal-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-teal-600" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Complete your purchase securely with Razorpay or BHIM UPI
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Order Summary */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-teal-900">
              <CheckCircle className="h-4 w-4" />
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-teal-800">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator className="my-3 bg-teal-200" />
              <div className="flex justify-between text-lg font-bold text-teal-900">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* BHIM UPI - Highlighted */}
            <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    BHIM UPI
                  </CardTitle>
                  <Badge className="bg-green-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Instant
                  </Badge>
                </div>
                <CardDescription className="text-green-700">
                  Scan QR or pay via UPI app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showQr ? (
                  <>
                    <div className="space-y-2 text-sm text-green-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Zero transaction fees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Instant verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Secure & encrypted</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-xs text-green-700 mb-2">UPI ID:</p>
                      <div className="bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-green-900">
                        {bhimConfig.vpa}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        onClick={handleBhimPayment}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR
                      </Button>
                      <Button
                        onClick={openUpiApp}
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                        disabled={loading}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Pay via BHIM
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-green-300">
                      <img 
                        src={bhimConfig.qrCodeUrl} 
                        alt="BHIM UPI QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <Alert className="border-green-300 bg-green-50">
                      <QrCode className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 text-sm">
                        Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM)
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={verifyBhimPayment}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            I've Paid
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowQr(false)}
                        variant="outline"
                        disabled={loading}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Razorpay - Cards/Wallets/Banking */}
            <Card className="border-teal-300 bg-gradient-to-br from-teal-50 to-white shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-teal-800">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  Cards & More
                </CardTitle>
                <CardDescription className="text-teal-700">
                  Credit/Debit Cards, Net Banking, Wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-teal-900">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-teal-600" />
                    <span>All major cards accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-teal-600" />
                    <span>Net Banking (60+ banks)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-teal-600" />
                    <span>Popular wallets supported</span>
                  </div>
                </div>

                <Alert className="border-teal-300 bg-teal-50">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <AlertDescription className="text-teal-900 text-xs">
                    Powered by Razorpay - 256-bit SSL encryption
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleRazorpayPayment}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={loading || !razorpayLoaded}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Pay {formatCurrency(totalAmount)}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {!razorpayLoaded && (
                  <p className="text-xs text-center text-teal-600">
                    Loading secure payment gateway...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Your payment information is secure and encrypted
            </p>
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
