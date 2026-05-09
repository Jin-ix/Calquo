import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { CreditCard, Smartphone, Wallet, Building } from 'lucide-react';
import { PurchaseRequest } from '../../types/purchaseTypes';

interface PaymentMethodSelectorProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest;
  onSelectMethod: (method: 'razorpay' | 'upi' | 'card' | 'netbanking') => void;
}

export function PaymentMethodSelector({
  open,
  onClose,
  request,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Select Payment Method
          </DialogTitle>
          <DialogDescription>
            All approvals received! Choose how you'd like to pay {formatCurrency(request.totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-900">Order Total</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatCurrency(request.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-800">{request.stockName}</span>
                  <span className="text-blue-800">{request.totalQuantity} units</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Razorpay - All Options */}
            <Card
              className="border-2 border-blue-300 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectMethod('razorpay')}
            >
              <CardContent className="pt-6 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Razorpay</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  UPI, Cards, Net Banking, Wallets
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Pay with Razorpay
                </Button>
              </CardContent>
            </Card>

            {/* Direct UPI */}
            <Card
              className="border-2 border-green-300 hover:border-green-500 cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectMethod('upi')}
            >
              <CardContent className="pt-6 text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-2">UPI Direct</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Quick payment via UPI apps
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Pay with UPI
                </Button>
              </CardContent>
            </Card>

            {/* Cards */}
            <Card
              className="border-2 border-purple-300 hover:border-purple-500 cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectMethod('card')}
            >
              <CardContent className="pt-6 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">Credit/Debit Card</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All major cards accepted
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Pay with Card
                </Button>
              </CardContent>
            </Card>

            {/* Net Banking */}
            <Card
              className="border-2 border-orange-300 hover:border-orange-500 cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectMethod('netbanking')}
            >
              <CardContent className="pt-6 text-center">
                <Building className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                <h3 className="font-semibold mb-2">Net Banking</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  60+ banks supported
                </p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Pay with Net Banking
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            🔒 All payments are secure and encrypted
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
