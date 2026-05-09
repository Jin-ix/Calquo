import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  MessageCircle,
  Target,
  Info
} from 'lucide-react';
import { StockItem } from './StockCard';
import { EnhancedStockItem } from './EnhancedStockTypes';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';

interface PurchaseRequestData {
  buyerName: string;
  selectedVariants: Array<{
    color: string;
    size: string;
    quantity: number;
    sku: string;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  notes: string;
}

interface LightProductDetailProps {
  product: StockItem | EnhancedStockItem;
  onBack: () => void;
  onAddToCart?: (product: StockItem | EnhancedStockItem, selectedVariants: any[]) => void;
  onPurchaseRequest?: (data: PurchaseRequestData) => void;
}

// Simple variant interface
interface SelectedVariant {
  color: string;
  size: string;
  quantity: number;
  sku: string;
  maxQuantity: number;
}

export function LightProductDetail({ product, onBack, onAddToCart, onPurchaseRequest }: LightProductDetailProps) {
  const { user } = useAuth();
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseFormData, setPurchaseFormData] = useState<PurchaseRequestData>({
    buyerName: '',
    selectedVariants: [],
    totalAmount: 0,
    deliveryAddress: '',
    notes: ''
  });

  // Check if product is enhanced stock
  const isEnhancedStock = (item: any): item is EnhancedStockItem => {
    return 'combinations' in item && Array.isArray(item.combinations);
  };

  // Calculate effective price
  const effectivePrice = useMemo(() => {
    if (isEnhancedStock(product) && product.customerPricing) {
      const customerPrice = product.customerPricing.find(cp => cp.customerId === user?.id);
      return customerPrice?.price || product.basePrice || product.price;
    }
    return product.price;
  }, [product, user?.id]);

  // Generate variant data
  const variantData = useMemo(() => {
    if (isEnhancedStock(product) && product.combinations) {
      const groups: { [key: string]: any[] } = {};
      
      product.combinations.forEach(combo => {
        const groupKey = combo.color;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        
        groups[groupKey].push({
          size: combo.size,
          quantity: combo.availableQuantity,
          sku: combo.sku || `${product.id}-${combo.color}-${combo.size}`,
          colorCode: combo.colorCode
        });
      });

      return Object.entries(groups).map(([color, variants]) => ({
        color,
        variants,
        colorCode: variants[0]?.colorCode
      }));
    }

    // Fallback for simple stock items
    return [{
      color: 'Default',
      variants: [{
        size: 'One Size',
        quantity: product.quantity,
        sku: product.id,
        colorCode: undefined
      }]
    }];
  }, [product]);

  // Calculate totals
  const totalQuantity = selectedVariants.reduce((sum, variant) => sum + variant.quantity, 0);
  const totalAmount = totalQuantity * effectivePrice;

  // Handle variant selection
  const handleVariantSelect = (color: string, size: string, sku: string, maxQuantity: number) => {
    setSelectedVariants(prev => {
      const existing = prev.find(v => v.color === color && v.size === size);
      if (existing) {
        return prev.filter(v => !(v.color === color && v.size === size));
      } else {
        return [...prev, { color, size, quantity: 1, sku, maxQuantity }];
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (color: string, size: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSelectedVariants(prev => 
      prev.map(variant => 
        variant.color === color && variant.size === size
          ? { ...variant, quantity: Math.min(newQuantity, variant.maxQuantity) }
          : variant
      )
    );
  };

  // Handle purchase request
  const handlePurchaseRequest = () => {
    if (!purchaseFormData.buyerName || !purchaseFormData.deliveryAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    const requestData: PurchaseRequestData = {
      ...purchaseFormData,
      selectedVariants: selectedVariants.map(v => ({
        color: v.color,
        size: v.size,
        quantity: v.quantity,
        sku: v.sku
      })),
      totalAmount
    };

    onPurchaseRequest?.(requestData);
    toast.success('Purchase request sent successfully!');
    setShowPurchaseForm(false);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    onAddToCart?.(product, selectedVariants);
    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">{product.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Info */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
              
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-bold text-primary">
                    ₹{effectivePrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">per piece</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <span>Stock: {isEnhancedStock(product) 
                    ? product.combinations?.reduce((total, combo) => total + combo.availableQuantity, 0) || 0
                    : product.quantity} pieces</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variant Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Select Variants
              {selectedVariants.length > 0 && (
                <Badge className="ml-2">{selectedVariants.length} selected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variantData.map((group, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-medium">{group.color}</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {group.variants.map((variant: any, vIndex: number) => {
                    const isSelected = selectedVariants.some(
                      sv => sv.color === group.color && sv.size === variant.size
                    );
                    const selectedVariant = selectedVariants.find(
                      sv => sv.color === group.color && sv.size === variant.size
                    );

                    return (
                      <Card
                        key={vIndex}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleVariantSelect(
                          group.color, 
                          variant.size, 
                          variant.sku, 
                          variant.quantity
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Size {variant.size}</span>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {variant.quantity} available
                            </div>

                            {isSelected && selectedVariant && (
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm">Qty:</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuantityChange(
                                        group.color, 
                                        variant.size, 
                                        selectedVariant.quantity - 1
                                      );
                                    }}
                                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                    disabled={selectedVariant.quantity <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center font-medium">
                                    {selectedVariant.quantity}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuantityChange(
                                        group.color, 
                                        variant.size, 
                                        selectedVariant.quantity + 1
                                      );
                                    }}
                                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                    disabled={selectedVariant.quantity >= variant.quantity}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        {selectedVariants.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total: {totalQuantity} items</p>
                    <p className="text-xl font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleAddToCart} variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button onClick={() => setShowPurchaseForm(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Request Purchase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Purchase Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Buyer Name *</label>
                <Input
                  value={purchaseFormData.buyerName}
                  onChange={(e) => setPurchaseFormData(prev => ({ ...prev, buyerName: e.target.value }))}
                  placeholder="Enter buyer name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Delivery Address *</label>
                <Textarea
                  value={purchaseFormData.deliveryAddress}
                  onChange={(e) => setPurchaseFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="Enter delivery address"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requirements"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowPurchaseForm(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handlePurchaseRequest} className="flex-1">
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
