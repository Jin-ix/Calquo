import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { OrderRequest } from '../orders/OrderDialog';
import { CreditCard, Smartphone, Building, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentInterfaceProps {
  order: {
    id: string;
    stockName: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    paymentStatus: string;
  };
  onPaymentComplete: (orderId: string, success: boolean, paymentMethod?: string) => void;
}

type PaymentMethod = 'upi' | 'bank' | 'card';

export function PaymentInterface({ order, onPaymentComplete }: PaymentInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('upi');
  
  const [paymentDetails, setPaymentDetails] = useState({
    // UPI
    upiId: '',
    // Bank Transfer
    bankAccount: '',
    ifscCode: '',
    accountHolder: '',
    // Card Payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Validate payment details based on method
      let isValid = false;
      switch (selectedPaymentMethod) {
        case 'upi':
          isValid = paymentDetails.upiId.includes('@') && paymentDetails.upiId.length >= 5;
          break;
        case 'bank':
          isValid = paymentDetails.bankAccount.length >= 8 && paymentDetails.ifscCode.length >= 11;
          break;
        case 'card':
          isValid = paymentDetails.cardNumber.length >= 16 && paymentDetails.cvv.length >= 3;
          break;
      }
      
      if (isValid) {
        toast.success(`Payment of ₹${order.totalAmount.toLocaleString()} processed successfully!`);
        onPaymentComplete(order.id, true, selectedPaymentMethod);
      } else {
        toast.error('Payment failed. Please check your payment details.');
        onPaymentComplete(order.id, false);
      }
    } catch (error) {
      toast.error('Payment processing error. Please try again.');
      onPaymentComplete(order.id, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="font-medium">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Product:</span>
              <span className="font-medium">{order.stockName}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{order.quantity} pieces</span>
            </div>
            <div className="flex justify-between">
              <span>Price per unit:</span>
              <span>₹{order.pricePerUnit.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <Label>Choose Payment Method</Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={selectedPaymentMethod === 'upi' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('upi')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              type="button"
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-xs">UPI</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === 'bank' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('bank')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              type="button"
            >
              <Building className="h-6 w-6" />
              <span className="text-xs">Bank Transfer</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('card')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              type="button"
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-xs">Card</span>
            </Button>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          {selectedPaymentMethod === 'upi' && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={paymentDetails.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                placeholder="yourname@paytm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your UPI ID (e.g., mobile@paytm, email@okaxis, etc.)
              </p>
            </div>
          )}

          {selectedPaymentMethod === 'bank' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  value={paymentDetails.accountHolder}
                  onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                  placeholder="Full name as per bank records"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={paymentDetails.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value.replace(/\D/g, ''))}
                  placeholder="Account number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={paymentDetails.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  required
                />
              </div>
            </>
          )}

          {selectedPaymentMethod === 'card' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={paymentDetails.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                    handleInputChange('cardNumber', value);
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formattedValue = value.replace(/(\d{2})(\d{2})/, '$1/$2');
                      handleInputChange('expiryDate', formattedValue);
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={paymentDetails.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Status */}
        <div className="flex items-center gap-2 text-sm">
          <span>Payment Status:</span>
          <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </Badge>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handlePayment} 
          className="w-full" 
          disabled={isProcessing || order.paymentStatus === 'completed'}
        >
          {isProcessing ? (
            'Processing Payment...'
          ) : order.paymentStatus === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Payment Completed
            </>
          ) : (
            `Pay ₹${order.totalAmount.toLocaleString()}`
          )}
        </Button>

        {/* Security Note */}
        <div className="text-xs text-muted-foreground text-center">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </CardContent>
    </Card>
  );
}
