import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { 
  Package, 
  ShoppingCart,
  Heart,
  Eye,
  Plus,
  Minus,
  IndianRupee,
  MapPin,
  Clock,
  Star,
  Send,
  Palette,
  Ruler,
  Grid,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EnhancedStockItem, ColorVariant, SizeVariant, StockCombination, getEffectivePrice } from './EnhancedStockTypes';
import { PatternDisplayComponent } from './PatternDisplayComponent';
import { SelectedCombination } from './ProductSelectionModal';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FriendlyProductSelectionModalProps {
  open: boolean;
  onClose: () => void;
  stock: EnhancedStockItem | null;
  isPreferredSupplier?: boolean;
  onTogglePreferred?: () => void;
  onProceedToPurchase?: (stock: EnhancedStockItem, selectedCombinations: SelectedCombination[], specialInstructions: string) => void;
}

export function FriendlyProductSelectionModal({ 
  open, 
  onClose, 
  stock,
  onProceedToPurchase,
  isPreferredSupplier = false,
  onTogglePreferred 
}: FriendlyProductSelectionModalProps) {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  
  const [selectedCombinations, setSelectedCombinations] = useState<SelectedCombination[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && stock) {
      setSelectedCombinations([]);
      setSpecialInstructions('');
      setCurrentImageIndex(0);
    }
  }, [open, stock]);

  // Get primary images
  const primaryImages = useMemo(() => {
    if (!stock) return [];
    
    const images: string[] = [];
    
    // Try main images first
    if (stock.mainImages && stock.mainImages.length > 0) {
      images.push(...stock.mainImages);
    }
    
    // Add images from colors
    if (stock.colors && stock.colors.length > 0) {
      stock.colors.forEach(color => {
        if (color.images && color.images.length > 0) {
          images.push(...color.images.slice(0, 2));
        }
      });
    }
    
    return [...new Set(images)].slice(0, 8);
  }, [stock?.id]);

  const currentImage = primaryImages[currentImageIndex] || null;

  // Calculate totals
  const totalQuantity = useMemo(() => {
    return selectedCombinations.reduce((sum, c) => sum + c.quantity, 0);
  }, [selectedCombinations]);

  const totalAmount = useMemo(() => {
    return selectedCombinations.reduce((sum, c) => sum + (c.quantity * c.pricePerUnit), 0);
  }, [selectedCombinations]);

  // Create lookup maps
  const sizeMap = useMemo(() => {
    const map = new Map();
    stock?.sizes?.forEach(size => map.set(size.id, size));
    return map;
  }, [stock?.sizes]);

  const colorMap = useMemo(() => {
    const map = new Map();
    stock?.colors?.forEach(color => map.set(color.id, color));
    return map;
  }, [stock?.colors]);

  if (!stock) return null;
  
  const effectivePrice = getEffectivePrice(stock, user?.role, user?.businessType);
  const isOnSale = stock.offerPrice && stock.offerPrice < effectivePrice;
  const totalAvailable = stock.combinations?.reduce((sum, combo) => sum + combo.availableQuantity, 0) || 0;

  const updateCombinationQuantity = (combinationId: string, quantity: number) => {
    if (!stock?.combinations) return;
    
    setSelectedCombinations(prev => {
      const existing = prev.find(c => c.combinationId === combinationId);
      
      if (quantity <= 0) {
        return prev.filter(c => c.combinationId !== combinationId);
      }
      
      const combination = stock.combinations.find(c => c.id === combinationId);
      if (!combination) return prev;

      const newCombination: SelectedCombination = {
        combinationId,
        colorId: combination.colorId,
        sizeId: combination.sizeId,
        quantity,
        availableQuantity: combination.availableQuantity,
        pricePerUnit: effectivePrice
      };

      if (existing) {
        return prev.map(c => c.combinationId === combinationId ? newCombination : c);
      } else {
        return [...prev, newCombination];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedCombinations.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!user?.company) {
      toast.error('User company information is required');
      return;
    }

    if (onProceedToPurchase && stock) {
      onProceedToPurchase(stock, selectedCombinations, specialInstructions);
      return;
    }

    // Fallback to direct submission
    setIsSubmitting(true);

    try {
      const orderRequest = {
        id: `REQ-${Date.now()}`,
        stockId: stock.id,
        stockName: stock.name,
        itemName: stock.name,
        quantity: totalQuantity,
        unitPrice: effectivePrice,
        totalAmount: totalAmount,
        buyerCompany: user.company,
        buyerEmail: user.email,
        supplierName: stock.supplier,
        supplierId: stock.id,
        orderDate: new Date().toISOString(),
        status: 'request_sent' as const,
        paymentStatus: 'pending' as const,
        paymentMethod: 'pending',
        deliveryAddress: user.address || 'Address to be provided',
        specialInstructions,
        itemSetType: stock.itemSetType,
        selectedCombinations: selectedCombinations.map(sc => ({
          combinationId: sc.combinationId,
          colorId: sc.colorId,
          sizeId: sc.sizeId,
          quantity: sc.quantity,
          pricePerUnit: sc.pricePerUnit
        }))
      };

      await addOrder(orderRequest);
      
      toast.success(`Request sent for ${stock.name}`);
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorDisplayName = (colorId: string) => {
    const color = colorMap.get(colorId);
    return color?.name || 'Pattern';
  };

  const getSizeDisplayName = (sizeId: string) => {
    const size = sizeMap.get(sizeId);
    return size?.displayName || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 bg-gradient-to-br from-blue-50/30 to-green-50/30">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                {stock.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Choose your preferred combinations • {totalAvailable} items available
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {isOnSale && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 animate-pulse">
                  Special Offer!
                </Badge>
              )}
              {stock.isTrending && (
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">
                  🔥 Trending
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Product Preview */}
          <div className="w-1/3 bg-white/50 backdrop-blur-sm border-r overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Image Display */}
              <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden group">
                <ImageWithFallback
                  src={currentImage || '/placeholder-product.jpg'}
                  alt={stock.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Image Thumbnails */}
              {primaryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {primaryImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-blue-500 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${stock.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Price & Basic Info */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold text-green-700">
                    ₹{effectivePrice.toLocaleString()}
                  </span>
                  {isOnSale && stock.offerPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ₹{stock.basePrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-green-600">per piece • Best wholesale price</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">Location</span>
                  </div>
                  <p className="text-sm font-semibold">{stock.location}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600">Min. Order</span>
                  </div>
                  <p className="text-sm font-semibold">{stock.minOrderQuantity} pcs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Selection Interface */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Selection Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Select Your Items</h3>
                  <span className="text-sm text-gray-600">
                    {selectedCombinations.length} selected • {totalQuantity} pieces
                  </span>
                </div>

                {/* Simplified Selection Interface */}
                <div className="space-y-3">
                  {stock.combinations?.map(combination => {
                    const size = sizeMap.get(combination.sizeId);
                    const color = colorMap.get(combination.colorId);
                    const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                    const selectedQuantity = selected?.quantity || 0;
                    const isSelected = selectedQuantity > 0;

                    return (
                      <div 
                        key={combination.id}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => !isSelected && updateCombinationQuantity(combination.id, 1)}
                      >
                        <div className="flex items-center justify-between">
                          {/* Item Info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                              isSelected 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {isSelected ? '✓' : '+'}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge variant={isSelected ? "default" : "outline"} className={isSelected ? 'bg-blue-600' : ''}>
                                {size?.displayName}
                              </Badge>
                              
                              {color && (
                                <div className="flex items-center gap-2">
                                  <PatternDisplayComponent 
                                    pattern={color} 
                                    showDefinitionBadges={false} 
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium">{getColorDisplayName(combination.colorId)}</span>
                                </div>
                              )}
                              
                              <span className="text-xs text-gray-500">
                                {combination.availableQuantity} available
                              </span>
                            </div>
                          </div>
                          
                          {/* Quantity Controls */}
                          {isSelected && (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCombinationQuantity(combination.id, selectedQuantity - 1)}
                                disabled={selectedQuantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <Input
                                type="number"
                                value={selectedQuantity}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  const clampedValue = Math.min(Math.max(1, newValue), combination.availableQuantity);
                                  updateCombinationQuantity(combination.id, clampedValue);
                                }}
                                min="1"
                                max={combination.availableQuantity}
                                className="h-8 w-16 text-center font-medium"
                              />
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCombinationQuantity(combination.id, selectedQuantity + 1)}
                                disabled={selectedQuantity >= combination.availableQuantity}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <div className="ml-2 text-right">
                                <div className="text-sm font-bold text-green-600">
                                  ₹{(selectedQuantity * effectivePrice).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="shrink-0 p-6 bg-gray-50 border-t">
              <Label className="text-sm font-medium text-gray-700">Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any specific requirements, packaging instructions, or delivery notes..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="mt-2 bg-white"
              />
            </div>

            {/* Action Footer */}
            <div className="shrink-0 p-6 bg-white border-t">
              {selectedCombinations.length > 0 ? (
                <>
                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">Total Items:</span>
                      <span className="font-bold">{totalQuantity} pieces</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-green-700">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-2"
                      disabled={isSubmitting || selectedCombinations.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {onProceedToPurchase ? 'Proceed to Purchase' : 'Send Request'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">Select items above to start your order</p>
                  <p className="text-sm text-gray-500">Choose from available sizes and patterns</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
