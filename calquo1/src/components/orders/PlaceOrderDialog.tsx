import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle,
  Plus,
  Minus,
  Calculator
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { StockItem } from '../stock/StockCard';
import { toast } from 'sonner';

interface PlaceOrderDialogProps {
  open: boolean;
  onClose: () => void;
  stock: StockItem | null;
  onOrderSubmit: (orderData: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    deliveryAddress: string;
    paymentMethod: string;
    specialInstructions?: string;
    supplierName?: string;
    estimatedDelivery?: string;
  }) => void;
}

type PaymentMethod = 'bank-transfer' | 'upi' | 'cod' | 'credit-card' | 'financial-agent';

const PAYMENT_METHODS = [
  { id: 'bank-transfer', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  { id: 'upi', label: 'UPI Payment', icon: '📱', description: 'Pay via UPI apps' },
  { id: 'credit-card', label: 'Credit/Debit Card', icon: '💳', description: 'Card payment' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', description: 'Pay on delivery' },
  { id: 'financial-agent', label: 'Financial Agent', icon: '🤝', description: 'Agent-assisted payment' }
];

export function PlaceOrderDialog({ open, onClose, stock, onOrderSubmit }: PlaceOrderDialogProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank-transfer');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (open && user?.profile?.address) {
      const address = user.profile.address;
      setDeliveryAddress(
        `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim()
      );
    }

    if (open && stock) {
      setQuantity(stock.minOrderQuantity || 1);
    }
  }, [open, user, stock]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setPaymentMethod('bank-transfer');
      setDeliveryAddress('');
      setSpecialInstructions('');
      setIsSubmitting(false);
    }
  }, [open]);

  if (!stock) return null;

  // Price calculations
  const getDisplayPrice = () => {
    if (user?.role === 'retailer' && user?.profile?.retailerType) {
      if (user.profile.retailerType === 'single-shop' && stock.singleShopPrice) {
        return stock.singleShopPrice;
      }
      if (user.profile.retailerType === 'multi-shop' && stock.multiShopPrice) {
        return stock.multiShopPrice;
      }
    }
    return stock.price;
  };

  const isOfferValid = () => {
    if (!stock.offerPrice || !stock.offerType) return false;

    if (stock.offerType === 'time' && stock.offerValidUntil) {
      return new Date() < new Date(stock.offerValidUntil);
    }

    if (stock.offerType === 'quantity' && stock.offerMinQuantity) {
      return quantity >= stock.offerMinQuantity;
    }

    return false;
  };

  const displayPrice = getDisplayPrice();
  const offerValid = isOfferValid();
  const finalUnitPrice = offerValid ? stock.offerPrice! : displayPrice;
  const totalAmount = finalUnitPrice * quantity;
  const savings = offerValid ? (displayPrice - finalUnitPrice) * quantity : 0;

  const handleQuantityChange = (newQuantity: number) => {
    const minQty = stock.minOrderQuantity || 1;
    const maxQty = stock.quantity;

    if (newQuantity >= minQty && newQuantity <= maxQty) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmit = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    if (quantity < (stock.minOrderQuantity || 1)) {
      toast.error(`Minimum order quantity is ${stock.minOrderQuantity || 1}`);
      return;
    }

    if (quantity > stock.quantity) {
      toast.error(`Only ${stock.quantity} pieces available`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate estimated delivery date (7-14 days from now)
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + (stock.deliveryTime ? 7 : 10));

      await onOrderSubmit({
        itemId: stock.id,
        itemName: stock.name,
        quantity,
        unitPrice: finalUnitPrice,
        totalAmount,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
        supplierName: stock.supplier,
        estimatedDelivery: estimatedDeliveryDate.toISOString()
      });

      toast.success('Order placed successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-none border border-zinc-200 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl tracking-tight text-zinc-900 flex items-center gap-3">
              <Package className="h-6 w-6 text-black" strokeWidth={1.5} />
              Send Order Request
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-2">
              Complete your order details including quantity, delivery address, and payment method.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto overflow-x-hidden flex-1">
          {/* Product Summary */}
          <div className="border border-zinc-200 bg-white">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-900">Order Details</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl text-zinc-900 leading-tight">{stock.name}</h3>
                  <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">{stock.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Size</span>
                      <span className="text-sm font-medium text-zinc-900">{stock.size}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Color</span>
                      <span className="text-sm font-medium text-zinc-900">{stock.color}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Category</span>
                      <span className="text-sm font-medium text-zinc-900">{stock.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <MapPin className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{stock.location}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <Badge
                    className={`rounded-none bg-black text-white hover:bg-zinc-800 text-[9px] uppercase tracking-widest font-bold border border-black px-3 py-1`}
                  >
                    {stock.quantity} available
                  </Badge>
                </div>
              </div>

              {/* Special Offer Banner */}
              {offerValid && (
                <div className="mt-6 p-4 bg-zinc-50 border border-zinc-200 flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-black shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 block mb-1">Special Offer Applied</span>
                    <p className="text-sm font-medium text-zinc-600">
                      {stock.offerType === 'quantity'
                        ? `Bulk discount for ordering ${stock.offerMinQuantity}+ pieces`
                        : `Limited time offer - save ₹${savings.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Trader-only notification */}
              {stock.tradersOnly && user?.role === 'retailer' && (
                <div className="mt-6 p-4 bg-zinc-50 border border-zinc-200 flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-black shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-900 block mb-1">Trader-Only Item</span>
                    <p className="text-sm font-medium text-zinc-600">
                      This item is available only for trader accounts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="border border-zinc-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
              Quantity
            </h3>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="quantity" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 block">Quantity to Order</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-none border-zinc-200 hover:border-black hover:bg-transparent"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= (stock.minOrderQuantity || 1)}
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="h-12 w-24 text-center rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black font-serif text-lg"
                      min={stock.minOrderQuantity || 1}
                      max={stock.quantity}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-none border-zinc-200 hover:border-black hover:bg-transparent"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= stock.quantity}
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 py-3 border-y border-zinc-100">
                  <span className="mr-4">Min Order: {stock.minOrderQuantity || 1} units</span>
                  <span>Available: {stock.quantity} units</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-zinc-50 p-6 border border-zinc-200">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-900 mb-6">
                  <Calculator className="h-4 w-4" strokeWidth={1.5} />
                  Price Calculation
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Unit Price</span>
                    <div className="flex items-center gap-3">
                      {offerValid ? (
                        <>
                          <span className="line-through text-zinc-400 font-medium">
                            ₹{displayPrice.toLocaleString()}
                          </span>
                          <span className="font-serif text-lg text-black">
                            ₹{finalUnitPrice.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-serif text-lg text-black">₹{finalUnitPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Quantity</span>
                    <span className="font-medium text-zinc-900">{quantity} units</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-black">Savings</span>
                      <span className="font-medium text-black">-₹{savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-[12px] uppercase font-bold tracking-widest text-zinc-900">Total Amount</span>
                    <span className="font-serif text-2xl text-black">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="border border-zinc-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              Delivery Address
            </h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="address" className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 block">Full Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete delivery address including city, state, and pincode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={4}
                  className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
                />
              </div>

              {stock.deliveryTime && (
                <div className="flex items-center gap-3 text-black p-4 bg-zinc-50 border border-zinc-200">
                  <Truck className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-medium text-sm">Expected delivery: {stock.deliveryTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method & Special Instructions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-zinc-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
                <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                Payment Method
              </h3>
              <div className="space-y-4">
                <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                  <SelectTrigger className="rounded-none border-zinc-200 h-12 focus:ring-0 focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200">
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id} className="cursor-pointer focus:bg-zinc-50 rounded-none">
                        <div className="flex items-center gap-3 py-1">
                          <span className="text-lg">{method.icon}</span>
                          <div>
                            <div className="font-medium text-zinc-900">{method.label}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{method.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPaymentMethod && (
                  <div className="p-4 bg-zinc-50 border border-zinc-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{selectedPaymentMethod.icon}</span>
                      <div>
                        <span className="font-medium text-zinc-900 block">{selectedPaymentMethod.label}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1 block">
                          {selectedPaymentMethod.description}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-zinc-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-zinc-900 border-b border-zinc-100 pb-4 mb-6">
                Special Instructions
              </h3>
              <Label htmlFor="specialInstructions" className="sr-only">Special Delivery Instructions (Optional)</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special delivery instructions or notes for the supplier..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={5}
                className="rounded-none border-zinc-200 focus-visible:ring-0 focus-visible:border-black resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-zinc-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-none border-zinc-200 text-zinc-600 hover:text-black uppercase tracking-[0.2em] text-[10px] font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !deliveryAddress.trim() || (stock.tradersOnly && user?.role === 'retailer')}
            className="h-12 px-8 rounded-none bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.2em] text-[10px] font-bold border border-black min-w-[280px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full mr-3" />
                Processing...
              </>
            ) : (
              <>
                Confirm Request • ₹{totalAmount.toLocaleString()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
