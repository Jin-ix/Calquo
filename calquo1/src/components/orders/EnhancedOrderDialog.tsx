import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useAuth } from '../auth/AuthProvider';
import { 
  EnhancedStockItem, 
  EnhancedOrderRequest,
  getAvailableColors,
  getAvailableSizes,
  getCombinationQuantity,
  getCombinationImages,
  getEffectivePrice
} from '../stock/EnhancedStockTypes';
import { 
  Package, Palette, Ruler, ShoppingCart, MapPin, 
  CreditCard, MessageSquare, Eye, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedOrderDialogProps {
  open: boolean;
  onClose: () => void;
  stock: EnhancedStockItem | null;
  onSubmit: (order: Omit<EnhancedOrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>) => void;
}

interface SelectedCombination {
  combinationId: string;
  colorId?: string;
  sizeId?: string;
  quantity: number;
  maxQuantity: number;
  pricePerUnit: number;
}

export function EnhancedOrderDialog({ open, onClose, stock, onSubmit }: EnhancedOrderDialogProps) {
  const { user } = useAuth();

  // Selection state
  const [selectedSetType, setSelectedSetType] = useState<'single_color' | 'all_sizes' | 'individual' | ''>('');
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [selectedCombinations, setSelectedCombinations] = useState<SelectedCombination[]>([]);
  
  // Order details
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer' | 'pending'>('pending');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Preview state
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!stock || !open) {
      resetForm();
      return;
    }

    // Set default selection type based on stock configuration
    if (stock.itemSetType === 'single_color') {
      setSelectedSetType('single_color');
      if (stock.colors.length > 0) {
        setSelectedColorId(stock.colors[0].id);
      }
    } else if (stock.itemSetType === 'all_sizes') {
      setSelectedSetType('all_sizes');
    } else {
      setSelectedSetType('individual');
    }
  }, [stock, open]);

  useEffect(() => {
    updatePreviewImages();
  }, [selectedColorId, selectedSizeIds, selectedCombinations]);

  const resetForm = () => {
    setSelectedSetType('');
    setSelectedColorId('');
    setSelectedSizeIds([]);
    setSelectedCombinations([]);
    setDeliveryAddress('');
    setPaymentMethod('pending');
    setSpecialInstructions('');
    setPreviewImages([]);
    setCurrentImageIndex(0);
  };

  const updatePreviewImages = () => {
    if (!stock) return;

    let images: string[] = [];

    if (selectedCombinations.length > 0) {
      // Show images from selected combinations
      selectedCombinations.forEach(combo => {
        const comboImages = getCombinationImages(stock, combo.colorId, combo.sizeId);
        images.push(...comboImages);
      });
    } else if (selectedColorId) {
      // Show images for selected color
      const colorImages = getCombinationImages(stock, selectedColorId);
      images.push(...colorImages);
    } else {
      // Show any available images
      const firstColor = stock.colors[0];
      if (firstColor) {
        const colorImages = getCombinationImages(stock, firstColor.id);
        images.push(...colorImages);
      }
    }

    // Remove duplicates
    const uniqueImages = Array.from(new Set(images));
    setPreviewImages(uniqueImages);
    setCurrentImageIndex(0);
  };

  const handleSetTypeChange = (setType: string) => {
    setSelectedSetType(setType as any);
    setSelectedCombinations([]);
    setSelectedSizeIds([]);
    
    if (setType === 'single_color' && stock && stock.colors.length > 0) {
      setSelectedColorId(stock.colors[0].id);
    } else if (setType === 'all_sizes') {
      setSelectedColorId('');
    }
  };

  const handleColorSelection = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedCombinations([]);
    setSelectedSizeIds([]);
  };

  const handleSizeSelection = (sizeId: string, checked: boolean) => {
    if (checked) {
      setSelectedSizeIds(prev => [...prev, sizeId]);
    } else {
      setSelectedSizeIds(prev => prev.filter(id => id !== sizeId));
      // Remove related combinations
      setSelectedCombinations(prev => prev.filter(combo => combo.sizeId !== sizeId));
    }
  };

  const handleIndividualCombinationToggle = (colorId: string, sizeId: string, checked: boolean) => {
    if (!stock) return;

    const combinationId = `${colorId}-${sizeId}`;
    const maxQuantity = getCombinationQuantity(stock, colorId, sizeId);
    const pricePerUnit = getEffectivePrice(stock, user?.role, user?.businessType);

    if (checked && maxQuantity > 0) {
      const newCombination: SelectedCombination = {
        combinationId,
        colorId,
        sizeId,
        quantity: Math.min(stock.minOrderQuantity, maxQuantity),
        maxQuantity,
        pricePerUnit
      };
      setSelectedCombinations(prev => [...prev, newCombination]);
    } else {
      setSelectedCombinations(prev => prev.filter(combo => combo.combinationId !== combinationId));
    }
  };

  const updateCombinationQuantity = (combinationId: string, quantity: number) => {
    setSelectedCombinations(prev => prev.map(combo =>
      combo.combinationId === combinationId
        ? { ...combo, quantity: Math.max(1, Math.min(quantity, combo.maxQuantity)) }
        : combo
    ));
  };

  const generateCombinationsForSetType = () => {
    if (!stock) return;

    const combinations: SelectedCombination[] = [];
    const pricePerUnit = getEffectivePrice(stock, user?.role, user?.businessType);

    if (selectedSetType === 'single_color' && selectedColorId) {
      // Single color, all available sizes
      const availableSizes = getAvailableSizes(stock);
      availableSizes.forEach(size => {
        const maxQuantity = getCombinationQuantity(stock, selectedColorId, size.id);
        if (maxQuantity > 0) {
          combinations.push({
            combinationId: `${selectedColorId}-${size.id}`,
            colorId: selectedColorId,
            sizeId: size.id,
            quantity: Math.min(stock.minOrderQuantity, maxQuantity),
            maxQuantity,
            pricePerUnit
          });
        }
      });
    } else if (selectedSetType === 'all_sizes') {
      // All colors, selected sizes
      const availableColors = getAvailableColors(stock);
      availableColors.forEach(color => {
        selectedSizeIds.forEach(sizeId => {
          const maxQuantity = getCombinationQuantity(stock, color.id, sizeId);
          if (maxQuantity > 0) {
            combinations.push({
              combinationId: `${color.id}-${sizeId}`,
              colorId: color.id,
              sizeId: sizeId,
              quantity: Math.min(stock.minOrderQuantity, maxQuantity),
              maxQuantity,
              pricePerUnit
            });
          }
        });
      });
    }

    setSelectedCombinations(combinations);
  };

  const calculateTotals = () => {
    const totalQuantity = selectedCombinations.reduce((sum, combo) => sum + combo.quantity, 0);
    const totalAmount = selectedCombinations.reduce((sum, combo) => sum + (combo.quantity * combo.pricePerUnit), 0);
    return { totalQuantity, totalAmount };
  };

  const isValidOrder = () => {
    if (!stock) return false;
    
    const { totalQuantity } = calculateTotals();
    
    if (selectedCombinations.length === 0) return false;
    if (totalQuantity < stock.minOrderQuantity) return false;
    if (!deliveryAddress.trim()) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stock || !isValidOrder()) {
      toast.error('Please complete all required fields');
      return;
    }

    const { totalQuantity, totalAmount } = calculateTotals();

    const orderRequest: Omit<EnhancedOrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'> = {
      stockId: stock.id,
      stockName: stock.name,
      itemSetType: selectedSetType as any,
      selectedCombinations: selectedCombinations.map(combo => ({
        combinationId: combo.combinationId,
        colorId: combo.colorId,
        sizeId: combo.sizeId,
        quantity: combo.quantity,
        pricePerUnit: combo.pricePerUnit
      })),
      totalQuantity,
      totalAmount,
      buyerCompany: user?.company || '',
      buyerEmail: user?.email,
      supplierName: stock.supplier,
      supplierLocation: stock.location,
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
      specialInstructions: specialInstructions.trim() || undefined
    };

    onSubmit(orderRequest);
    resetForm();
    onClose();
    toast.success('Request sent successfully!');
  };

  if (!stock) return null;

  const { totalQuantity, totalAmount } = calculateTotals();
  const availableColors = getAvailableColors(stock);
  const availableSizes = getAvailableSizes(stock);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Send Request - {stock.name}
          </DialogTitle>
          <DialogDescription>
            Configure your product options and send a request to the supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Product Options */}
          <div className="space-y-4">
            
            {/* Stock Information */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{stock.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Supplier: {stock.supplier}</p>
                    <p>Location: {stock.location}</p>
                    <p>Min Order: {stock.minOrderQuantity} pieces</p>
                    <p>Price: ₹{(getEffectivePrice(stock, user?.role, user?.businessType) || 0).toLocaleString()} per piece</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Set Type Selection */}
            {stock.flexibleSelectionAllowed && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="text-base font-medium">Choose Selection Type</Label>
                  <RadioGroup value={selectedSetType} onValueChange={handleSetTypeChange}>
                    {stock.itemSetType === 'single_color' && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single_color" id="set_single_color" />
                        <Label htmlFor="set_single_color">Single Color Set (All Sizes)</Label>
                      </div>
                    )}
                    {stock.itemSetType === 'all_sizes' && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all_sizes" id="set_all_sizes" />
                        <Label htmlFor="set_all_sizes">All Sizes Set (Selected Colors)</Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual_selection" />
                      <Label htmlFor="individual_selection">Individual Selection</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Color Selection */}
            {availableColors.length > 0 && (selectedSetType === 'all_sizes' || selectedSetType === 'individual' || !stock.flexibleSelectionAllowed) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Palette className="h-4 w-4" />
                    {selectedSetType === 'single_color' ? 'Selected Color' : 'Choose Colors'}
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {availableColors.map((color) => {
                      const colorImages = getCombinationImages(stock, color.id);
                      return (
                        <div key={color.id}>
                          {selectedSetType === 'single_color' ? (
                            <div className="flex items-center gap-3 p-3 border rounded bg-muted/20">
                              <div 
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: color.colorCode }}
                              />
                              <div className="flex-1">
                                <span className="font-medium">{color.name}</span>
                                <p className="text-xs text-muted-foreground">Selected color for this set</p>
                              </div>
                              {colorImages.length > 0 && (
                                <div className="flex gap-1">
                                  {colorImages.slice(0, 3).map((img, idx) => (
                                    <img 
                                      key={idx} 
                                      src={img} 
                                      alt={`${color.name} preview`}
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {colorImages.length > 3 && (
                                    <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                                      +{colorImages.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div 
                              className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-all ${
                                selectedColorId === color.id 
                                  ? 'border-primary bg-primary/10 shadow-sm' 
                                  : 'hover:bg-muted/50 hover:shadow-sm'
                              }`}
                              onClick={() => handleColorSelection(color.id)}
                            >
                              <div 
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: color.colorCode }}
                              />
                              <div className="flex-1">
                                <span className="font-medium">{color.name}</span>
                                <p className="text-xs text-muted-foreground">
                                  {colorImages.length} image(s) available
                                </p>
                              </div>
                              {colorImages.length > 0 && (
                                <div className="flex gap-1">
                                  {colorImages.slice(0, 3).map((img, idx) => (
                                    <img 
                                      key={idx} 
                                      src={img} 
                                      alt={`${color.name} preview`}
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {colorImages.length > 3 && (
                                    <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                                      +{colorImages.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                              {selectedColorId === color.id && (
                                <div className="text-primary">
                                  <Eye className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (selectedSetType === 'all_sizes' || selectedSetType === 'individual') && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Ruler className="h-4 w-4" />
                    Choose Sizes
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSizes.map((size) => (
                      <div key={size.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`size-${size.id}`}
                          checked={selectedSizeIds.includes(size.id)}
                          onCheckedChange={(checked) => handleSizeSelection(size.id, checked as boolean)}
                        />
                        <Label htmlFor={`size-${size.id}`} className="text-sm cursor-pointer">
                          {size.displayName}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedSizeIds.length > 0 && selectedSetType === 'all_sizes' && (
                    <Button 
                      type="button" 
                      onClick={generateCombinationsForSetType}
                      className="w-full"
                      size="sm"
                    >
                      Generate Combinations
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Individual Combination Selection */}
            {selectedSetType === 'individual' && selectedColorId && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="text-base font-medium">Select Individual Combinations</Label>
                  <div className="space-y-2">
                    {availableSizes.map((size) => {
                      const maxQuantity = getCombinationQuantity(stock, selectedColorId, size.id);
                      const combinationId = `${selectedColorId}-${size.id}`;
                      const isSelected = selectedCombinations.some(c => c.combinationId === combinationId);
                      
                      return (
                        <div key={size.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleIndividualCombinationToggle(selectedColorId, size.id, checked as boolean)}
                              disabled={maxQuantity === 0}
                            />
                            <span>{size.displayName}</span>
                            <Badge variant={maxQuantity > 0 ? "outline" : "secondary"}>
                              {maxQuantity > 0 ? `${maxQuantity} available` : 'Out of stock'}
                            </Badge>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                max={maxQuantity}
                                value={selectedCombinations.find(c => c.combinationId === combinationId)?.quantity || 1}
                                onChange={(e) => updateCombinationQuantity(combinationId, parseInt(e.target.value) || 1)}
                                className="w-16"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Combinations for Set Types */}
            {((selectedSetType === 'single_color' && selectedColorId) || (selectedSetType === 'all_sizes' && selectedSizeIds.length > 0)) && selectedCombinations.length === 0 && (
              <Card>
                <CardContent className="p-4">
                  <Button 
                    type="button" 
                    onClick={generateCombinationsForSetType}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Generate Combinations for {selectedSetType === 'single_color' ? 'Single Color Set' : 'All Sizes Set'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Details & Preview */}
          <div className="space-y-4">
            
            {/* Product Images Preview */}
            {previewImages.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Eye className="h-4 w-4" />
                    Product Preview
                    {selectedColorId && (
                      <Badge variant="outline" className="ml-auto">
                        {colors.find(c => c.id === selectedColorId)?.name}
                      </Badge>
                    )}
                  </Label>
                  <div className="relative">
                    <img
                      src={previewImages[currentImageIndex]}
                      alt="Product preview"
                      className="w-full h-48 object-cover rounded border"
                    />
                    {previewImages.length > 1 && (
                      <div className="flex justify-center gap-1 mt-2">
                        {previewImages.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Image thumbnail strip */}
                  {previewImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {previewImages.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                            index === currentImageIndex 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-muted-foreground/20 hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Selected Combinations Summary */}
            {selectedCombinations.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="text-base font-medium">Selected Items</Label>
                  <div className="space-y-2">
                    {selectedCombinations.map((combo) => {
                      const color = availableColors.find(c => c.id === combo.colorId);
                      const size = availableSizes.find(s => s.id === combo.sizeId);
                      
                      return (
                        <div key={combo.combinationId} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color?.colorCode }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{color?.name}</span>
                                <span className="text-muted-foreground">×</span>
                                <span className="font-medium text-sm">{size?.displayName}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Max: {combo.maxQuantity} available
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                max={combo.maxQuantity}
                                value={combo.quantity}
                                onChange={(e) => updateCombinationQuantity(combo.combinationId, parseInt(e.target.value) || 1)}
                                className="w-20 h-8"
                              />
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                ₹{(combo.quantity * combo.pricePerUnit).toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₹{combo.pricePerUnit}/pc
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Delivery Address */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label htmlFor="deliveryAddress" className="flex items-center gap-2 text-base font-medium">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter complete delivery address..."
                    rows={3}
                    required
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">To be decided</SelectItem>
                      <SelectItem value="upi">UPI Payment</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label htmlFor="specialInstructions" className="flex items-center gap-2 text-base font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requirements or instructions..."
                    rows={2}
                  />
                </CardContent>
              </Card>

              <Separator />

              {/* Order Summary */}
              <Card className="border-primary/20">
                <CardContent className="p-4 space-y-4">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Package className="h-4 w-4" />
                    Order Summary
                  </Label>
                  
                  {/* Selection Summary */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Item Set Type:</span>
                        <span className="font-medium">
                          {selectedSetType === 'single_color' ? 'Single Color Set' :
                           selectedSetType === 'all_sizes' ? 'All Sizes Set' : 'Individual Selection'}
                        </span>
                      </div>
                      {selectedCombinations.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Combinations Selected:</span>
                          <span className="font-medium">{selectedCombinations.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Pricing Summary */}
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Quantity:</span>
                      <span className="font-medium">{totalQuantity} pieces</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per piece:</span>
                      <span>₹{(getEffectivePrice(stock, user?.role, user?.businessType) || 0).toLocaleString()}</span>
                    </div>
                    
                    {/* Show offer savings if applicable */}
                    {stock.offerPrice && stock.basePrice && stock.offerPrice < stock.basePrice && (
                      <div className="flex justify-between text-green-600">
                        <span>You Save:</span>
                        <span>₹{((stock.basePrice - stock.offerPrice) * totalQuantity).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{(totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Validation Messages */}
                  {totalQuantity < stock.minOrderQuantity ? (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Minimum order not met:</strong> Need {stock.minOrderQuantity - totalQuantity} more pieces
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <strong>Ready to order:</strong> All requirements met
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={!isValidOrder()}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Send Request
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
