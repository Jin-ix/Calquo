import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, ShoppingCart, Info, Package, MapPin, Calendar, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';

import { EnhancedStockItem, getEffectivePrice, getAvailableColors, getAvailableSizes, getCombinationImages } from './EnhancedStockTypes';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Local helper as a fallback to prevent "is not a function" errors
const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};

interface SelectedVariant {
  stockId: string;
  colorId?: string;
  sizeId?: string;
  quantity: number;
  notes?: string;
  stockItem: EnhancedStockItem;
}

interface StockDetailModalProps {
  stock: EnhancedStockItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToRequest: (variants: SelectedVariant[]) => void;
  userRole?: string;
  businessType?: string;
}

// Unique key generator to prevent React key collisions
const generateUniqueKey = (() => {
  let counter = 0;
  return (prefix: string = 'key') => {
    counter++;
    return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 9)}`;
  };
})();

export function StockDetailModal({ 
  stock, 
  isOpen, 
  onClose, 
  onAddToRequest, 
  userRole, 
  businessType 
}: StockDetailModalProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Map<string, SelectedVariant>>(new Map());

  // Get available options - memoized to prevent unnecessary re-renders
  const availableColors = useMemo(() => getAvailableColors(stock), [stock]);
  const availableSizes = useMemo(() => getAvailableSizes(stock), [stock]);
  const effectivePrice = useMemo(() => getEffectivePrice(stock, userRole, businessType), [stock, userRole, businessType]);
  const hasOffer = useMemo(() => stock.offerPrice && stock.offerPrice > 0 && stock.offerPrice < stock.basePrice, [stock.offerPrice, stock.basePrice]);

  // Get current combination details
  const currentCombination = useMemo(() => {
    if (stock.itemSetType === 'individual_flex') {
      return stock.combinations[0]; // For individual flex, there's typically one combination
    }
    
    return stock.combinations.find(combo => 
      combo.colorId === selectedColor && combo.sizeId === selectedSize
    );
  }, [stock, selectedColor, selectedSize]);

  const currentStock = currentCombination?.availableQuantity || 0;
  const currentImages = useMemo(() => getCombinationImages(stock, selectedColor, selectedSize), [stock, selectedColor, selectedSize]);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedColor(availableColors[0]?.id || null);
      setSelectedSize(availableSizes[0]?.id || null);
      setQuantity(1);
      setNotes('');
      setSelectedVariants(new Map());
    }
  }, [isOpen, availableColors, availableSizes]);

  // Add current selection to variants
  const addCurrentSelection = React.useCallback(() => {
    if (stock.itemSetType === 'individual_flex') {
      // For individual flex, no specific color/size combination
      const key = `${stock.id}-flex`;
      const variant: SelectedVariant = {
        stockId: stock.id,
        quantity,
        notes,
        stockItem: stock
      };
      
      const newVariants = new Map(selectedVariants);
      const existing = newVariants.get(key);
      
      if (existing) {
        newVariants.set(key, { ...existing, quantity: existing.quantity + quantity });
      } else {
        newVariants.set(key, variant);
      }
      
      setSelectedVariants(newVariants);
      toast.success('Added to selection');
      return;
    }

    if (!selectedColor || !selectedSize) {
      toast.error('Please select both color and size');
      return;
    }

    if (currentStock < quantity) {
      toast.error('Insufficient stock available');
      return;
    }

    const key = `${stock.id}-${selectedColor}-${selectedSize}`;
    const variant: SelectedVariant = {
      stockId: stock.id,
      colorId: selectedColor,
      sizeId: selectedSize,
      quantity,
      notes,
      stockItem: stock
    };

    const newVariants = new Map(selectedVariants);
    const existing = newVariants.get(key);
    
    if (existing) {
      newVariants.set(key, { ...existing, quantity: existing.quantity + quantity });
    } else {
      newVariants.set(key, variant);
    }
    
    setSelectedVariants(newVariants);
    toast.success('Added to selection');
    setQuantity(1);
  }, [stock, selectedColor, selectedSize, currentStock, quantity, notes, selectedVariants]);

  // Remove variant from selection
  const removeVariant = (key: string) => {
    const newVariants = new Map(selectedVariants);
    newVariants.delete(key);
    setSelectedVariants(newVariants);
    toast.success('Removed from selection');
  };

  // Calculate totals
  const totalQuantity = Array.from(selectedVariants.values()).reduce((sum, variant) => sum + variant.quantity, 0);
  const totalAmount = Array.from(selectedVariants.values()).reduce((sum, variant) => sum + (variant.quantity * effectivePrice), 0);

  // Handle final add to request
  const handleAddToRequest = () => {
    if (selectedVariants.size === 0) {
      toast.error('Please select at least one variant');
      return;
    }

    onAddToRequest(Array.from(selectedVariants.values()));
    setSelectedVariants(new Map());
  };

  // Get color display name
  const getColorDisplayName = (colorId: string) => {
    const color = availableColors.find(c => c.id === colorId);
    return color?.name || `Color ${colorId}`;
  };

  // Get size display name
  const getSizeDisplayName = (sizeId: string) => {
    const size = availableSizes.find(s => s.id === sizeId);
    return size?.displayName || size?.name || `Size ${sizeId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{getSafeString(stock.name)}</DialogTitle>
              <DialogDescription>
                View product details and select combinations
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getSafeString(stock.category)}</Badge>
                <Badge variant="secondary">
                  {getSafeString(stock.itemSetType).replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {hasOffer && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{stock.basePrice}
                  </span>
                )}
                <span className="text-2xl font-bold">₹{effectivePrice}</span>
              </div>
              <p className="text-xs text-muted-foreground">per unit</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {currentImages.length > 0 ? (
                    <ImageWithFallback
                      src={currentImages[0]}
                      alt={getSafeString(stock.name)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {stock.itemSetType !== 'individual_flex' && (
                  <div className="space-y-4">
                    {availableColors.length > 1 && (
                      <div className="space-y-2">
                        <Label>Select Color</Label>
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                          {availableColors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setSelectedColor(color.id)}
                              className={`aspect-square rounded-lg border-2 p-1 transition-all ${
                                selectedColor === color.id 
                                  ? 'border-primary ring-2 ring-primary/20' 
                                  : 'border-gray-300 hover:border-primary/50'
                              }`}
                            >
                              {color.patternImage ? (
                                <ImageWithFallback
                                  src={color.patternImage}
                                  alt={getSafeString(color.name)}
                                  className="w-full h-full object-cover rounded-sm"
                                />
                              ) : (
                                <div
                                  className="w-full h-full rounded-sm"
                                  style={{ backgroundColor: color.colorCode || '#f3f4f6' }}
                                />
                              )}
                              <p className="text-[10px] mt-1 line-clamp-1">{getSafeString(color.name)}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSizes.length > 1 && (
                      <div className="space-y-2">
                        <Label>Select Size</Label>
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                          {availableSizes.map((size) => (
                            <Button
                              key={size.id}
                              variant={selectedSize === size.id ? 'default' : 'outline'}
                              onClick={() => setSelectedSize(size.id)}
                              className="h-10 text-xs"
                            >
                              {getSafeString(size.displayName || size.name)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= currentStock}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={addCurrentSelection}
                    className="w-full"
                    disabled={stock.itemSetType !== 'individual_flex' && (!selectedColor || !selectedSize || currentStock < quantity)}
                  >
                    Add to Selection
                  </Button>
                </div>
              </div>

              <div className="space-y-4 border-l pl-6">
                <h4 className="font-semibold">Selected Variants</h4>
                {selectedVariants.size === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                    <Package className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nothing selected</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {Array.from(selectedVariants.entries()).map(([key, variant]) => (
                      <Card key={key} className="relative">
                        <CardContent className="p-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">
                              {variant.colorId && getSafeString(getColorDisplayName(variant.colorId))} 
                              {variant.colorId && variant.sizeId && ' • '}
                              {variant.sizeId && getSafeString(getSizeDisplayName(variant.sizeId))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {variant.quantity} × ₹{effectivePrice} = ₹{(variant.quantity * effectivePrice).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(key)}
                            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="pt-4 mt-4 border-t space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>Total ({totalQuantity} units)</span>
                        <span>₹{totalAmount.toLocaleString()}</span>
                      </div>
                      <Button onClick={handleAddToRequest} className="w-full">
                        Update Purchase Request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
