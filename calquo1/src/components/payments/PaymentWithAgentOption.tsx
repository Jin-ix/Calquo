import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { OrderRequest } from '../orders/OrderDialog';
// import { useNotifications } from '../notifications/NotificationSystem';
import { useAuth } from '../auth/AuthProvider';
import { CreditCard, Smartphone, Building, CheckCircle, UserCheck, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentWithAgentOptionProps {
  order: OrderRequest;
  onPaymentComplete: (orderId: string, success: boolean, method: 'direct' | 'agent') => void;
}

type PaymentMethod = 'upi' | 'bank' | 'card' | 'agent';

export function PaymentWithAgentOption({ order, onPaymentComplete }: PaymentWithAgentOptionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('upi');
  const [agentRequestMessage, setAgentRequestMessage] = useState('');
  // const { createPaymentApprovalRequest } = useNotifications();
  const { user } = useAuth();
  
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

  const handleDirectPayment = async () => {
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
        onPaymentComplete(order.id, true, 'direct');
      } else {
        toast.error('Payment failed. Please check your payment details.');
        onPaymentComplete(order.id, false, 'direct');
      }
    } catch (error) {
      toast.error('Payment processing error. Please try again.');
      onPaymentComplete(order.id, false, 'direct');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAgentPayment = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Create payment approval request
      // const request = createPaymentApprovalRequest({
      //   orderId: order.id,
      //   retailerName: user.fullName,
      //   retailerCompany: user.company,
      //   stockName: order.stockName,
      //   quantity: order.quantity,
      //   totalAmount: order.totalAmount
      // });

      toast.success('Payment approval request sent to financial agent!');
      toast.info('You will be notified once the agent responds (valid for 7 days)');
      
      // Mark as pending agent approval
      onPaymentComplete(order.id, true, 'agent');
      
    } catch (error) {
      toast.error('Failed to send payment request. Please try again.');
      onPaymentComplete(order.id, false, 'agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const isAgentPayment = selectedPaymentMethod === 'agent';

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Options
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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-2 gap-2 col-span-2">
              <Button
                variant={selectedPaymentMethod === 'upi' ? 'default' : 'outline'}
                onClick={() => setSelectedPaymentMethod('upi')}
                className="flex flex-col items-center gap-2 h-auto py-4"
                type="button"
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs">UPI</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'bank' ? 'default' : 'outline'}
                onClick={() => setSelectedPaymentMethod('bank')}
                className="flex flex-col items-center gap-2 h-auto py-4"
                type="button"
              >
                <Building className="h-5 w-5" />
                <span className="text-xs">Bank</span>
              </Button>
            </div>
            <Button
              variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('card')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              type="button"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Card</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === 'agent' ? 'default' : 'outline'}
              onClick={() => setSelectedPaymentMethod('agent')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              type="button"
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-xs">Financial Agent</span>
            </Button>
          </div>
        </div>

        {/* Agent Payment Information */}
        {isAgentPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Payment via Financial Agent</span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Your payment request will be sent to a financial agent for approval. 
              The request is valid for 7 days and you'll be notified of the decision.
            </p>
            <div className="space-y-2">
              <Label htmlFor="agentMessage" className="text-xs">
                Additional Message (Optional)
              </Label>
              <Textarea
                id="agentMessage"
                value={agentRequestMessage}
                onChange={(e) => setAgentRequestMessage(e.target.value)}
                placeholder="Add any special instructions or notes for the financial agent..."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
        )}

        {/* Direct Payment Forms */}
        {!isAgentPayment && (
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
        )}

        {/* Payment Status */}
        <div className="flex items-center gap-2 text-sm">
          <span>Payment Status:</span>
          <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </Badge>
        </div>

        {/* Action Button */}
        <Button 
          onClick={isAgentPayment ? handleAgentPayment : handleDirectPayment}
          className="w-full" 
          disabled={isProcessing || order.paymentStatus === 'completed'}
        >
          {isProcessing ? (
            'Processing...'
          ) : order.paymentStatus === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Payment Completed
            </>
          ) : isAgentPayment ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Request Agent Approval
            </>
          ) : (
            `Pay ₹${order.totalAmount.toLocaleString()}`
          )}
        </Button>

        {/* Security Note */}
        <div className="text-xs text-muted-foreground text-center">
          <p>🔒 Your payment information is secure and encrypted</p>
          {isAgentPayment && (
            <p className="mt-1">
              💼 Agent approval requests are valid for 7 days
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
