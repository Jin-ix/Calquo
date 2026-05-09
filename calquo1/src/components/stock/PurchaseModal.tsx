/**
 * CALIQUO - Enhanced Purchase Modal with Payment Integration
 * Full purchasing flow with variant selection, quantity stepper, discount codes, and Razorpay payment
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form@7.55.0';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  X, 
  Minus, 
  Plus, 
  Tag, 
  CreditCard, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { EnhancedStockItem, getEffectivePrice } from './EnhancedStockTypes';
import { purchaseService } from '../../utils/firebase/purchaseService';

// Zod validation schema
const purchaseFormSchema = z.object({
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Maximum quantity is 100'),
  variant: z.string().optional(),
  discountCode: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EnhancedStockItem | null;
  onPaymentSuccess: (orderId: string) => void;
}

export function PurchaseModal({ open, onOpenChange, item, onPaymentSuccess }: PurchaseModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [step, setStep] = useState<'input' | 'review'>('input');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      quantity: 1,
      variant: '',
      discountCode: '',
      specialInstructions: '',
    }
  });

  const quantity = watch('quantity');
  const discountCode = watch('discountCode');

  // Calculate base price based on selected variant or item base price
  const getBasePrice = (): number => {
    if (!item) return 0;
    
    if (selectedVariant && item.combinations) {
      const combo = item.combinations.find(c => c.id === selectedVariant);
      if (combo) {
        return getEffectivePrice(item, user?.role, user?.businessType) || 0;
      }
    }
    
    return getEffectivePrice(item, user?.role, user?.businessType) || 0;
  };

  // Update total when quantity, variant, or discount changes
  useEffect(() => {
    if (!item) return;
    
    const basePrice = getBasePrice();
    const subtotal = basePrice * quantity;
    const newTotal = subtotal - discount;
    
    setTotal(Math.max(0, newTotal));
  }, [quantity, selectedVariant, discount, item]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      reset();
      setDiscount(0);
      setSelectedVariant('');
      setStep('input');
    }
  }, [open, reset]);

  // Apply discount code
  const handleApplyDiscount = () => {
    if (!discountCode) {
      toast.error('Please enter a discount code');
      return;
    }

    // Mock discount validation
    const validCodes: Record<string, number> = {
      'SAVE10': 0.10, // 10% off
      'SAVE20': 0.20, // 20% off
      'FIRST50': 50,  // ₹50 flat discount
      'BULK100': 100, // ₹100 flat discount
    };

    const code = discountCode.toUpperCase();
    if (validCodes[code]) {
      const basePrice = getBasePrice();
      const subtotal = basePrice * quantity;
      
      let discountAmount: number;
      if (code === 'FIRST50' || code === 'BULK100') {
        // Flat discount
        discountAmount = validCodes[code];
      } else {
        // Percentage discount
        discountAmount = subtotal * validCodes[code];
      }
      
      setDiscount(discountAmount);
      toast.success(`Discount applied: ₹${discountAmount.toFixed(2)} off!`, {
        icon: <Tag className="h-4 w-4 text-green-600" />
      });
    } else {
      toast.error('Invalid discount code');
      setDiscount(0);
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(100, quantity + delta));
    
    // Check against available stock
    if (item && newQuantity > item.combinations.reduce((sum, c) => sum + c.availableQuantity, 0)) {
      toast.error('Quantity exceeds available stock');
      return;
    }
    
    setValue('quantity', newQuantity);
  };

  // Handle form submission and purchase request
  const onSubmit = async (data: PurchaseFormData) => {
    if (!item || !user) return;

    // Validate variant selection if item has variants
    if (item.combinations.length > 1 && !selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    // Validate quantity against available stock
    const availableStock = selectedVariant 
      ? item.combinations.find(c => c.id === selectedVariant)?.availableQuantity || 0
      : item.combinations.reduce((sum, c) => sum + c.availableQuantity, 0);

    if (data.quantity > availableStock) {
      toast.error(`Only ${availableStock} units available`);
      return;
    }

    // If still in input step, move to review
    if (step === 'input') {
      setStep('review');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Send Purchase Request
      const requestId = await purchaseService.createRequest({
        buyerId: user.id,
        buyerName: user.name,
        buyerCompany: user.company,
        buyerGST: user.profile?.gstNumber || '',
        sellerId: (item as any).sellerId || (item as any)['seller' + '_id'] || (item as any).userId || (item as any).supplierId || (item as any).updatedBy, // Robust ID lookup
        sellerName: item.supplier,
        sellerCompany: item.supplier, // Using name as company for now
        stockId: item.id,
        stockName: item.name,
        stockImage: item.mainImages?.[0] || '',
        items: [{
          combinationId: selectedVariant || 'default',
          quantity: data.quantity,
          pricePerUnit: getBasePrice(),
          totalPrice: total
        }],
        totalAmount: total,
        totalQuantity: data.quantity,
        status: 'pending_seller_ack',
        specialInstructions: data.specialInstructions,
      });

      toast.success('Purchase request sent successfully!', {
        description: 'Seller will be notified.',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Purchase request error:', error);
      toast.error('Failed to send purchase request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!item) return null;

  const basePrice = getBasePrice();
  const mainImage = item.mainImages?.[0] || item.colors[0]?.images[0] || item.colors[0]?.patternImage || '';
  const availableStock = item.combinations.reduce((sum, c) => sum + c.availableQuantity, 0);
  const hasVariants = item.combinations.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Request Purchase: {item.name}
                </DialogTitle>
                <DialogDescription>
                  Send a purchase request to the seller. You can choose payment method after acknowledgement.
                </DialogDescription>
              </DialogHeader>

              {/* Product Image */}
              <div className="my-4 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={mainImage}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {step === 'input' ? (
                  <>
                    {/* Variant Selection */}
                    {hasVariants && (
                      <div className="space-y-2">
                        <Label htmlFor="variant">Select Variant *</Label>
                        <Select
                          value={selectedVariant}
                          onValueChange={setSelectedVariant}
                        >
                          <SelectTrigger id="variant">
                            <SelectValue placeholder="Choose color and size" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.combinations.map((combo) => {
                              const color = item.colors.find(c => c.id === combo.colorId);
                              const size = item.sizes.find(s => s.id === combo.sizeId);
                              const price = getEffectivePrice(item, user?.role, user?.businessType);
                              
                              return (
                                <SelectItem key={combo.id} value={combo.id}>
                                  {color?.name || 'Color'} - {size?.name || 'Size'} (₹{price})
                                  {combo.availableQuantity <= 10 && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Only {combo.availableQuantity} left
                                    </Badge>
                                  )}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {!selectedVariant && hasVariants && (
                          <p className="text-xs text-red-600">Please select a variant</p>
                        )}
                      </div>
                    )}

                    {/* Quantity Stepper */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="h-10 w-10 rounded-full"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          id="quantity"
                          type="number"
                          {...register('quantity', { valueAsNumber: true })}
                          className="w-16 text-center font-semibold"
                          min={1}
                          max={availableStock}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= availableStock}
                          className="h-10 w-10 rounded-full hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <span className="text-sm text-muted-foreground ml-2">
                          of {availableStock} available
                        </span>
                      </div>
                      {errors.quantity && (
                        <p className="text-xs text-red-600">{errors.quantity.message}</p>
                      )}
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                      <Input
                        id="specialInstructions"
                        placeholder="Any specific requirements..."
                        {...register('specialInstructions')}
                      />
                    </div>

                    {/* Discount Code */}
                    <div className="space-y-2">
                      <Label htmlFor="discountCode">Discount Code (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="discountCode"
                          placeholder="Enter code (e.g., SAVE10)"
                          {...register('discountCode')}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyDiscount}
                          className="gap-2"
                        >
                          <Tag className="h-4 w-4" />
                          Apply
                        </Button>
                      </div>
                      {discount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Discount applied: -₹{discount.toFixed(2)}
                        </motion.div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per unit:</span>
                        <span className="font-medium">₹{basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">₹{(basePrice * quantity).toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-₹{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">Total:</span>
                          <motion.span
                            key={total}
                            initial={{ scale: 1.1, color: '#16a34a' }}
                            animate={{ scale: 1, color: '#000000' }}
                            className="font-bold text-xl text-green-600"
                          >
                            ₹{total.toFixed(2)}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm space-y-3">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Review Order Details
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-gray-700">
                        <span className="text-muted-foreground">Item:</span>
                        <span className="font-medium text-right">{item.name}</span>
                        
                        {selectedVariant && (
                          <>
                            <span className="text-muted-foreground">Variant:</span>
                            <span className="font-medium text-right">
                              {(() => {
                                const combo = item.combinations.find(c => c.id === selectedVariant);
                                const color = item.colors.find(c => c.id === combo?.colorId);
                                const size = item.sizes.find(s => s.id === combo?.sizeId);
                                return `${color?.name || 'Color'} / ${size?.name || 'Size'}`;
                              })()}
                            </span>
                          </>
                        )}

                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-right">{quantity} pcs</span>
                        
                        <span className="text-muted-foreground">Price/Unit:</span>
                        <span className="font-medium text-right">₹{basePrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center font-bold text-lg text-blue-900">
                        <span>Total Payable:</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      By clicking confirm, a purchase request will be sent to the seller.
                      <br />Payment will be collected after seller acknowledgement.
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={step === 'review' ? () => setStep('input') : () => onOpenChange(false)}
                    disabled={isProcessing}
                  >
                    {step === 'review' ? 'Back' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing || (hasVariants && !selectedVariant && step === 'input')}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : step === 'input' ? (
                      <>
                        Review Order
                        <Send className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm & Send
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
