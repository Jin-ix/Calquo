import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CreditCard, Building, Smartphone, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface JoiningFeePaymentProps {
  userRole: 'manufacturer' | 'trader' | 'financial';
  userDetails: {
    fullName: string;
    email: string;
    company: string;
  };
  onPaymentComplete: (success: boolean) => void;
  onBack: () => void;
}

type PaymentMethod = 'card' | 'bank' | 'upi';

export function JoiningFeePayment({ userRole, userDetails, onPaymentComplete, onBack }: JoiningFeePaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card payment form
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // Bank transfer form
  const [bankData, setBankData] = useState({
    accountNumber: '',
    routingNumber: '',
    bankName: ''
  });

  // UPI form
  const [upiId, setUpiId] = useState('');

  const joiningFee = 100; // $100 USD

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'manufacturer': return 'Manufacturer';
      case 'trader': return 'Trader';
      case 'financial': return 'Financial Agent';
      default: return 'Business';
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment validation
      let isValid = false;
      switch (paymentMethod) {
        case 'card':
          isValid = cardData.cardNumber.length >= 16 && cardData.cvv.length >= 3 && cardData.expiryDate.length >= 5;
          break;
        case 'bank':
          isValid = bankData.accountNumber.length >= 8 && bankData.routingNumber.length >= 6;
          break;
        case 'upi':
          isValid = upiId.includes('@') && upiId.length >= 5;
          break;
      }

      if (isValid) {
        toast.success(`Payment of $${joiningFee} processed successfully!`);
        onPaymentComplete(true);
      } else {
        toast.error('Payment failed. Please check your information and try again.');
        onPaymentComplete(false);
      }
    } catch (error) {
      toast.error('Payment processing error. Please try again.');
      onPaymentComplete(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Registration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Registration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pay the joining fee to activate your {getRoleDisplayName()} account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Registration Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Account Type:</span>
              <Badge variant="outline">{getRoleDisplayName()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Company:</span>
              <span className="text-sm">{userDetails.company}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm">{userDetails.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span>Joining Fee:</span>
              <span className="text-lg font-semibold">${joiningFee} USD</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label>Choose Payment Method</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs">Credit/Debit Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('bank')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Building className="h-6 w-6" />
                <span className="text-xs">Bank Transfer</span>
              </Button>
              <Button
                variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('upi')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Smartphone className="h-6 w-6" />
                <span className="text-xs">UPI</span>
              </Button>
            </div>
          </div>

          {/* Payment Forms */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={cardData.cardholderName}
                    onChange={(e) => setCardData(prev => ({ ...prev, cardholderName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData(prev => ({ ...prev, cardNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={cardData.expiryDate}
                    onChange={(e) => setCardData(prev => ({ ...prev, expiryDate: e.target.value }))}
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
                    value={cardData.cvv}
                    onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankData.bankName}
                  onChange={(e) => setBankData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Bank of America"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="1234567890"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={bankData.routingNumber}
                    onChange={(e) => setBankData(prev => ({ ...prev, routingNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="123456789"
                    maxLength={9}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@paytm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your UPI ID (e.g., mobile@paytm, email@okaxis, etc.)
              </p>
            </div>
          )}

          {/* Payment Action */}
          <div className="pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                `Pay $${joiningFee} USD`
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>Your payment is secured with industry-standard encryption.</p>
            <p>By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
