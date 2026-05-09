import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Package, 
  Grid, 
  Layers, 
  Palette, 
  Ruler, 
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  ImageIcon,
  Eye,
  Heart,
  MapPin,
  Clock,
  Tag,
  Star,
  Send
} from 'lucide-react';
import { EnhancedStockItem, ColorVariant, SizeVariant, StockCombination, getEffectivePrice } from './EnhancedStockTypes';
import { PatternDisplayComponent } from './PatternDisplayComponent';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ProductSelectionModalProps {
  open: boolean;
  onClose: () => void;
  stock: EnhancedStockItem | null;
  isPreferredSupplier?: boolean;
  onTogglePreferred?: () => void;
  onProceedToPurchase?: (stock: EnhancedStockItem, selectedCombinations: SelectedCombination[], specialInstructions: string) => void;
}

export interface SelectedCombination {
  combinationId: string;
  colorId?: string;
  sizeId?: string;
  quantity: number;
  availableQuantity: number;
  pricePerUnit: number;
}

export function ProductSelectionModal({ 
  open, 
  onClose, 
  stock,
  onProceedToPurchase,
  isPreferredSupplier = false,
  onTogglePreferred 
}: ProductSelectionModalProps) {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  
  const [selectedCombinations, setSelectedCombinations] = useState<SelectedCombination[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && stock) {
      setIsLoading(true);
      setSelectedCombinations([]);
      setSpecialInstructions('');
      setCurrentImageIndex(0);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open, stock]);

  // Simplified image data calculation
  const primaryImages = useMemo(() => {
    if (!stock) return [];
    
    try {
      // Try to get images from first color
      if (stock.colors && stock.colors.length > 0) {
        const firstColor = stock.colors[0];
        if (firstColor.images && firstColor.images.length > 0) {
          return firstColor.images.slice(0, 3);
        }
      }

      // Fallback to combination images
      if (stock.combinations && stock.combinations.length > 0) {
        const firstCombination = stock.combinations[0];
        if (firstCombination.images && firstCombination.images.length > 0) {
          return firstCombination.images.slice(0, 2);
        }
      }

      return [];
    } catch (error) {
      console.error('Error loading primary images:', error);
      return [];
    }
  }, [stock?.id]);

  const currentImage = useMemo(() => {
    return primaryImages[currentImageIndex] || null;
  }, [primaryImages, currentImageIndex]);

  // Memoize expensive calculations
  const totalAvailableQuantity = useMemo(() => {
    return stock?.combinations ? stock.combinations.reduce(
      (sum, combo) => sum + combo.availableQuantity, 
      0
    ) : 0;
  }, [stock?.combinations]);

  const totalQuantity = useMemo(() => {
    return selectedCombinations.reduce((sum, c) => sum + c.quantity, 0);
  }, [selectedCombinations]);

  const totalAmount = useMemo(() => {
    return selectedCombinations.reduce((sum, c) => sum + (c.quantity * c.pricePerUnit), 0);
  }, [selectedCombinations]);

  // Memoize grouped data
  const groupedCombinationsByColor = useMemo(() => {
    if (!stock?.colors || !stock?.combinations) return [];
    
    return stock.colors.map(color => ({
      color,
      combinations: stock.combinations.filter(c => c.colorId === color.id)
    })).filter(group => group.combinations.length > 0);
  }, [stock?.colors, stock?.combinations]);

  // Memoize lookup maps
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
  const isOutOfStock = totalAvailableQuantity === 0;
  const isLowStock = totalAvailableQuantity > 0 && totalAvailableQuantity <= 10;

  const getStockTypeLabel = () => {
    switch (stock.itemSetType) {
      case 'set_of_pattern':
        return 'Set of Pattern - Choose from different patterns and sizes';
      case 'single_color':
        return 'Set of Sizes - Multiple sizes in the same pattern/color';
      case 'individual_flex':
        return 'Flexible Selection - Pick any combination of size and pattern/color';
      default:
        return 'Product configuration';
    }
  };

  const getStockTypeIcon = () => {
    switch (stock.itemSetType) {
      case 'set_of_pattern':
        return <Palette className="h-4 w-4" />;
      case 'single_color':
        return <Ruler className="h-4 w-4" />;
      case 'individual_flex':
        return <Grid className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

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

  const getColorDisplayName = (colorId: string) => {
    const color = colorMap.get(colorId);
    if (!color) return 'Unknown';
    return color.name || 'Pattern';
  };

  const getSizeDisplayName = (sizeId: string) => {
    const size = sizeMap.get(sizeId);
    return size?.displayName || 'Unknown';
  };

  const getTotalQuantity = () => totalQuantity;
  const getTotalAmount = () => totalAmount;

  const handleSubmit = async () => {
    if (selectedCombinations.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!user?.company) {
      toast.error('User company information is required');
      return;
    }

    // If onProceedToPurchase callback is provided, use the new purchase page flow
    if (onProceedToPurchase && stock) {
      onProceedToPurchase(stock, selectedCombinations, specialInstructions);
      return;
    }

    // Fallback to original direct submission flow
    setIsSubmitting(true);

    try {
      // Create order request
      const orderRequest = {
        id: `REQ-${Date.now()}`,
        stockId: stock.id,
        stockName: stock.name,
        itemName: stock.name,
        quantity: getTotalQuantity(),
        unitPrice: effectivePrice,
        totalAmount: getTotalAmount(),
        buyerCompany: user.company,
        buyerEmail: user.email,
        supplierName: stock.supplier,
        supplierId: stock.id
        orderDate: new Date().toISOString(),
        status: 'request_sent' as const,
        paymentStatus: 'pending' as const,
        paymentMethod: 'pending',
        deliveryAddress: user.address || 'Address to be provided',
        specialInstructions,
        // Enhanced data for new system
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

  const renderSetOfPatternView = () => {
    if (!stock || groupedCombinationsByColor.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {/* Compact guidance */}
        <div className="text-sm bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200/40">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-600" />
            <p className="text-blue-800 font-medium">Select patterns and sizes - tap to add, use +/- to adjust quantity</p>
          </div>
        </div>
        
        {groupedCombinationsByColor.slice(0, 5).map(({ color, combinations: patternCombinations }) => {
        const limitedCombinations = patternCombinations.slice(0, 10);
        if (limitedCombinations.length === 0) return null;

          return (
            <Card key={color.id} className="border bg-white shadow-sm">
              {/* Compact Pattern Header */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <PatternDisplayComponent pattern={color} showDefinitionBadges={false} size="sm" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800">{getColorDisplayName(color.id)}</h4>
                    <p className="text-xs text-blue-600">{patternCombinations.length} sizes available</p>
                  </div>
                  <div className="text-xs text-blue-700">
                    {limitedCombinations.filter(c => selectedCombinations.find(sc => sc.combinationId === c.id)?.quantity > 0).length} selected
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* One-line selection interface */}
                <div className="divide-y">
                  {limitedCombinations.map(combination => {
                    const size = sizeMap.get(combination.sizeId);
                    const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                    const selectedQuantity = selected?.quantity || 0;
                    const isSelected = selectedQuantity > 0;

                    return (
                      <div 
                        key={combination.id} 
                        className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer
                          ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}
                        `}
                        onClick={() => !isSelected && updateCombinationQuantity(combination.id, 1)}
                      >
                        {/* Left: Selection + Size Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
                            ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}
                          `}>
                            {isSelected ? '✓' : '+'}
                          </div>
                          <Badge variant={isSelected ? "default" : "outline"} className={isSelected ? 'bg-emerald-600' : ''}>
                            {size?.displayName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {combination.availableQuantity} available
                          </span>
                        </div>
                        
                        {/* Right: Quantity Controls */}
                        {isSelected && (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.max(0, selectedQuantity - 1))}
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
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value) || 1;
                                const clampedValue = Math.min(Math.max(1, newValue), combination.availableQuantity);
                                updateCombinationQuantity(combination.id, clampedValue);
                              }}
                              min="1"
                              max={combination.availableQuantity}
                              className="h-8 w-12 text-center p-1 font-medium border-emerald-300"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.min(combination.availableQuantity, selectedQuantity + 1))}
                              disabled={selectedQuantity >= combination.availableQuantity}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSetOfSizesView = () => {
    if (!stock || groupedCombinationsByColor.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {/* Compact guidance */}
        <div className="text-sm bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200/40">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-orange-600" />
            <p className="text-orange-800 font-medium">Select size sets - tap to add, use +/- to adjust quantity</p>
          </div>
        </div>
        
        {groupedCombinationsByColor.map(({ color, combinations: colorCombinations }) => {
          const groupSelected = colorCombinations.filter(c => selectedCombinations.find(sc => sc.combinationId === c.id)?.quantity > 0);

          return (
            <Card key={color.id} className="border bg-white shadow-sm">
              {/* Compact Pattern Header */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <PatternDisplayComponent pattern={color} showDefinitionBadges={false} size="sm" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-800">{getColorDisplayName(color.id)}</h4>
                    <p className="text-xs text-orange-600">{colorCombinations.length} sizes available</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-orange-700">
                      {groupSelected.length}/{colorCombinations.length} selected
                    </div>
                    {/* Quick Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => colorCombinations.forEach(c => updateCombinationQuantity(c.id, 1))}
                      className="h-6 px-2 text-xs text-orange-600"
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => colorCombinations.forEach(c => updateCombinationQuantity(c.id, 0))}
                      className="h-6 px-2 text-xs text-orange-600"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* One-line selection interface */}
                <div className="divide-y">
                  {colorCombinations.map(combination => {
                    const size = sizeMap.get(combination.sizeId);
                    const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                    const selectedQuantity = selected?.quantity || 0;
                    const isSelected = selectedQuantity > 0;

                    return (
                      <div 
                        key={combination.id} 
                        className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer
                          ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}
                        `}
                        onClick={() => !isSelected && updateCombinationQuantity(combination.id, 1)}
                      >
                        {/* Left: Selection + Size Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
                            ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}
                          `}>
                            {isSelected ? '✓' : '+'}
                          </div>
                          <Badge variant={isSelected ? "default" : "outline"} className={isSelected ? 'bg-orange-600' : ''}>
                            {size?.displayName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {combination.availableQuantity} available
                          </span>
                        </div>
                        
                        {/* Right: Quantity Controls */}
                        {isSelected && (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.max(0, selectedQuantity - 1))}
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
                              onBlur={(e) => {
                                const newValue = parseInt(e.target.value) || 1;
                                const clampedValue = Math.min(Math.max(1, newValue), combination.availableQuantity);
                                updateCombinationQuantity(combination.id, clampedValue);
                              }}
                              min="1"
                              max={combination.availableQuantity}
                              className="h-8 w-12 text-center p-1 font-medium border-orange-300"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.min(combination.availableQuantity, selectedQuantity + 1))}
                              disabled={selectedQuantity >= combination.availableQuantity}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderFlexibleView = () => {
    if (!stock?.combinations || stock.combinations.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {/* Compact guidance */}
        <div className="text-sm bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-200/40">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-violet-600" />
            <p className="text-violet-800 font-medium">Mix & match any combination - tap to add, use +/- to adjust quantity</p>
          </div>
        </div>
        
        {/* One-line selection interface */}
        <Card className="border bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {stock.combinations.map(combination => {
                const size = sizeMap.get(combination.sizeId);
                const color = colorMap.get(combination.colorId);
                const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                const selectedQuantity = selected?.quantity || 0;
                const isSelected = selectedQuantity > 0;

                return (
                  <div 
                    key={combination.id} 
                    className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer
                      ${isSelected ? 'bg-violet-50' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => !isSelected && updateCombinationQuantity(combination.id, 1)}
                  >
                    {/* Left: Selection + Item Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
                        ${isSelected ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-600'}
                      `}>
                        {isSelected ? '✓' : '+'}
                      </div>
                      <Badge variant={isSelected ? "default" : "outline"} className={isSelected ? 'bg-violet-600' : ''}>
                        {size?.displayName || 'Unknown'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {color && (
                          <PatternDisplayComponent 
                            pattern={color} 
                            showDefinitionBadges={false} 
                            size="xs"
                          />
                        )}
                        <span className="text-sm">{getColorDisplayName(combination.colorId || '')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {combination.availableQuantity} available
                      </span>
                    </div>
                    
                    {/* Right: Quantity Controls */}
                    {isSelected && (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCombinationQuantity(combination.id, Math.max(0, selectedQuantity - 1))}
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
                          onBlur={(e) => {
                            const newValue = parseInt(e.target.value) || 1;
                            const clampedValue = Math.min(Math.max(1, newValue), combination.availableQuantity);
                            updateCombinationQuantity(combination.id, clampedValue);
                          }}
                          min="1"
                          max={combination.availableQuantity}
                          className="h-8 w-12 text-center p-1 font-medium border-violet-300"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCombinationQuantity(combination.id, Math.min(combination.availableQuantity, selectedQuantity + 1))}
                          disabled={selectedQuantity >= combination.availableQuantity}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getAvailabilityStatus = () => {
    if (isOutOfStock) {
      return { text: 'Out of Stock', color: 'destructive' as const };
    }
    if (isLowStock) {
      return { text: 'Low Stock', color: 'secondary' as const };
    }
    return { text: 'In Stock', color: 'default' as const };
  };

  const status = getAvailabilityStatus();

  // Early return with fallback if data is malformed
  if (!stock || !stock.combinations || !stock.colors || !stock.sizes) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Product information could not be loaded. Please try again later.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load product details</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Product Details
            </DialogTitle>
            <DialogDescription>
              Loading product information...
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-4 w-4" />
            {stock.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Select combinations and quantities for your purchase request
          </DialogDescription>
        </DialogHeader>

        {/* Compact Content Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Product Info (30%) */}
          <div className="w-1/3 border-r bg-gray-50/50 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Compact Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden relative">
                <ImageWithFallback
                  src={currentImage || '/placeholder-product.jpg'}
                  alt={stock.name}
                  className="w-full h-full object-cover"
                />
                {isOnSale && (
                  <Badge className="absolute top-2 right-2 bg-green-600 text-xs">
                    Sale
                  </Badge>
                )}
              </div>

              {/* Key Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-primary">₹{effectivePrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <Badge variant={status.color} className="text-xs">{status.text}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Min Order:</span>
                  <span>{stock.minOrderQuantity}</span>
                </div>
                <div className="flex items-center gap-1 justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="truncate">{stock.location}</span>
                </div>
              </div>

              {/* Stock Type Indicator */}
              <div className="p-2 bg-white rounded border">
                <div className="flex items-center gap-2 text-xs">
                  {getStockTypeIcon()}
                  <div>
                    <p className="font-medium">{stock.itemSetType?.replace('_', ' ')}</p>
                    <p className="text-muted-foreground">{getStockTypeLabel()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Selection Interface (70%) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Dynamic Content Based on Stock Type */}
              {stock.itemSetType === 'set_of_pattern' && renderSetOfPatternView()}
              {stock.itemSetType === 'single_color' && renderSetOfSizesView()}
              {stock.itemSetType === 'individual_flex' && renderFlexibleView()}
            </div>

            {/* Special Instructions - Bottom Panel */}
            <div className="border-t bg-gray-50/50 p-4 space-y-3">
              <Label className="text-sm font-medium">Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special requirements..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="border-t bg-white p-4 space-y-3 shrink-0">
            {selectedCombinations.length > 0 ? (
              <>
                {/* Order Summary */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Selected:</span>
                    <span className="text-sm">{getTotalQuantity()} items</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Total:</span>
                    <span className="font-bold text-green-900">₹{getTotalAmount().toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isSubmitting || selectedCombinations.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        {onProceedToPurchase ? 'Proceeding...' : 'Sending...'}
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
              <div className="text-center text-muted-foreground py-4">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Select items above to start your order</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
