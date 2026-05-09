import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StockItem } from '../stock/StockCard';
import { useAuth } from '../auth/AuthProvider';

import { OrderRequest } from '../context/OrderProvider';

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  stock: StockItem | null;
  onSubmit: (order: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>) => void;
}

export function OrderDialog({ open, onClose, stock, onSubmit }: OrderDialogProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer'>('upi');

  if (!stock) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderQuantity = parseInt(quantity);
    const totalAmount = orderQuantity * stock.price;

    const order: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> = {
      stockId: stock.id,
      stockName: stock.name,
      stockItemId: stock.id,
      itemName: stock.name,
      quantity: orderQuantity,
      pricePerUnit: stock.price,
      unitPrice: stock.price,
      totalAmount,
      buyerName: user?.name || '',
      buyerCompany: user?.company || '',
      supplierName: stock.supplier,
      stockImage: stock.images?.[0],
      paymentMethod
    };

    onSubmit(order);
    setQuantity('');
    onClose();
  };

  const orderQuantity = parseInt(quantity) || 0;
  const totalAmount = orderQuantity * stock.price;
  const isValidOrder = orderQuantity >= stock.minOrderQuantity && orderQuantity <= stock.quantity;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Order Request</DialogTitle>
          <DialogDescription>
            Configure your order details and send a request for this stock item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stock Details */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium">{stock.name}</h3>
            <div className="text-sm text-muted-foreground space-y-1 mt-2">
              <p>Supplier: {stock.supplier}</p>
              <p>Available: {stock.quantity} pieces</p>
              <p>Min Order: {stock.minOrderQuantity} pieces</p>
              <p>Price: ₹{stock.price.toLocaleString()} per piece</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Min ${stock.minOrderQuantity}, Max ${stock.quantity}`}
                min={stock.minOrderQuantity}
                max={stock.quantity}
                required
              />
              {quantity && !isValidOrder && (
                <p className="text-sm text-destructive">
                  Quantity must be between {stock.minOrderQuantity} and {stock.quantity}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: 'upi' | 'bank_transfer') => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI Payment</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <h4 className="font-medium">Order Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{orderQuantity} pieces</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per piece:</span>
                  <span>₹{stock.price.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={!isValidOrder}>
                Send Request
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
