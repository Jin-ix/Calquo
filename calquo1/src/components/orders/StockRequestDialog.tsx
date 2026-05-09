import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  ImageIcon
} from 'lucide-react';
import { EnhancedStockItem, ColorVariant, SizeVariant, StockCombination } from '../stock/EnhancedStockTypes';
import { PatternDisplayComponent } from '../stock/PatternDisplayComponent';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { toast } from 'sonner';

interface StockRequestDialogProps {
  open: boolean;
  onClose: () => void;
  stock: EnhancedStockItem | null;
}

interface SelectedCombination {
  combinationId: string;
  colorId?: string;
  sizeId?: string;
  quantity: number;
  availableQuantity: number;
  pricePerUnit: number;
}

export function StockRequestDialog({ open, onClose, stock }: StockRequestDialogProps) {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  
  const [selectedCombinations, setSelectedCombinations] = useState<SelectedCombination[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && stock) {
      setSelectedCombinations([]);
      setSpecialInstructions('');
    }
  }, [open, stock]);

  if (!stock) return null;

  const getStockTypeLabel = () => {
    switch (stock.itemSetType) {
      case 'set_of_pattern':
        return 'This product is listed as Set of Pattern';
      case 'single_color':
        return 'This product is listed as Set of Sizes';
      case 'individual_flex':
        return 'This product is listed as Flexible';
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
        pricePerUnit: stock.basePrice
      };

      if (existing) {
        return prev.map(c => c.combinationId === combinationId ? newCombination : c);
      } else {
        return [...prev, newCombination];
      }
    });
  };

  const getColorDisplayName = (colorId: string) => {
    const color = stock.colors.find(c => c.id === colorId);
    if (!color) return 'Unknown';
    return color.name || 'Pattern';
  };

  const getSizeDisplayName = (sizeId: string) => {
    const size = stock.sizes.find(s => s.id === sizeId);
    return size?.displayName || 'Unknown';
  };

  const getTotalQuantity = () => {
    return selectedCombinations.reduce((sum, c) => sum + c.quantity, 0);
  };

  const getTotalAmount = () => {
    return selectedCombinations.reduce((sum, c) => sum + (c.quantity * c.pricePerUnit), 0);
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

    setIsSubmitting(true);

    try {
      // Create order request
      const orderRequest = {
        id: `REQ-${Date.now()}`,
        stockId: stock.id,
        stockName: stock.name,
        itemName: stock.name,
        quantity: getTotalQuantity(),
        unitPrice: stock.basePrice,
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
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select patterns and their available sizes. You can choose different quantities for each size within a pattern.
        </p>
        
        {stock.colors.map(color => {
          const patternCombinations = stock.combinations.filter(c => c.colorId === color.id);
          if (patternCombinations.length === 0) return null;

          return (
            <Card key={color.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <PatternDisplayComponent 
                    pattern={color} 
                    showDefinitionBadges={false} 
                    size="sm"
                  />
                  <div>
                    <CardTitle className="text-base">{getColorDisplayName(color.id)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {patternCombinations.length} sizes available
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3">
                  {patternCombinations.map(combination => {
                    const size = stock.sizes.find(s => s.id === combination.sizeId);
                    const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                    const selectedQuantity = selected?.quantity || 0;

                    return (
                      <div key={combination.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedQuantity > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCombinationQuantity(combination.id, 1);
                              } else {
                                updateCombinationQuantity(combination.id, 0);
                              }
                            }}
                          />
                          <div>
                            <Badge variant="outline">{size?.displayName}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Available: {combination.availableQuantity}
                            </p>
                          </div>
                        </div>
                        
                        {selectedQuantity > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.max(0, selectedQuantity - 1))}
                              disabled={selectedQuantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={combination.availableQuantity}
                              value={selectedQuantity}
                              onChange={(e) => {
                                const qty = Math.min(combination.availableQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                updateCombinationQuantity(combination.id, qty);
                              }}
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.min(combination.availableQuantity, selectedQuantity + 1))}
                              disabled={selectedQuantity >= combination.availableQuantity}
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
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select from available size groups. Each group contains multiple sizes with the same pattern/color.
        </p>
        
        {stock.colors.map(color => {
          const colorCombinations = stock.combinations.filter(c => c.colorId === color.id);
          if (colorCombinations.length === 0) return null;

          return (
            <Card key={color.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <PatternDisplayComponent 
                    pattern={color} 
                    showDefinitionBadges={false} 
                    size="sm"
                  />
                  <div>
                    <CardTitle className="text-base">{getColorDisplayName(color.id)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Size group with {colorCombinations.length} sizes
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Available Sizes</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {colorCombinations.map(combination => {
                      const size = stock.sizes.find(s => s.id === combination.sizeId);
                      const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                      const selectedQuantity = selected?.quantity || 0;

                      return (
                        <div key={combination.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedQuantity > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateCombinationQuantity(combination.id, 1);
                                } else {
                                  updateCombinationQuantity(combination.id, 0);
                                }
                              }}
                            />
                            <Badge variant="outline">{size?.displayName}</Badge>
                          </div>
                          {selectedQuantity > 0 && (
                            <div className="flex items-center gap-1">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                min="0"
                                max={combination.availableQuantity}
                                value={selectedQuantity}
                                onChange={(e) => {
                                  const qty = Math.min(combination.availableQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                  updateCombinationQuantity(combination.id, qty);
                                }}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs text-muted-foreground">/{combination.availableQuantity}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderFlexibleView = () => {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select from all available combinations. Each row represents a unique size and color/pattern combination.
        </p>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium">
              <span>Select</span>
              <span>Size</span>
              <span>Pattern/Color</span>
              <span>Available</span>
              <span>Quantity</span>
            </div>
          </div>
          
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {stock.combinations.map(combination => {
                const size = stock.sizes.find(s => s.id === combination.sizeId);
                const color = stock.colors.find(c => c.id === combination.colorId);
                const selected = selectedCombinations.find(sc => sc.combinationId === combination.id);
                const selectedQuantity = selected?.quantity || 0;

                return (
                  <div key={combination.id} className="px-4 py-3">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <Checkbox
                        checked={selectedQuantity > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateCombinationQuantity(combination.id, 1);
                          } else {
                            updateCombinationQuantity(combination.id, 0);
                          }
                        }}
                      />
                      
                      <Badge variant="outline">{size?.displayName || 'Unknown'}</Badge>
                      
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
                      
                      <span className="text-sm">{combination.availableQuantity}</span>
                      
                      <div className="flex items-center gap-1">
                        {selectedQuantity > 0 ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.max(0, selectedQuantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={combination.availableQuantity}
                              value={selectedQuantity}
                              onChange={(e) => {
                                const qty = Math.min(combination.availableQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                updateCombinationQuantity(combination.id, qty);
                              }}
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCombinationQuantity(combination.id, Math.min(combination.availableQuantity, selectedQuantity + 1))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (selectedCombinations.length === 0) return null;

    return (
      <Card className="bg-green-50/50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            {selectedCombinations.map(selected => {
              const combination = stock.combinations.find(c => c.id === selected.combinationId);
              const size = stock.sizes.find(s => s.id === selected.sizeId);
              const color = stock.colors.find(c => c.id === selected.colorId);
              
              return (
                <div key={selected.combinationId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{size?.displayName}</Badge>
                    {color && (
                      <PatternDisplayComponent 
                        pattern={color} 
                        showDefinitionBadges={false} 
                        size="xs"
                      />
                    )}
                    <span>{getColorDisplayName(selected.colorId || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{selected.quantity} × ₹{selected.pricePerUnit}</span>
                    <span className="font-medium">₹{selected.quantity * selected.pricePerUnit}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center font-medium">
            <span>Total: {getTotalQuantity()} items</span>
            <span className="text-lg">₹{getTotalAmount().toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Send Request - {stock.name}
          </DialogTitle>
          <DialogDescription>
            Specify your requirements and send a request to the supplier for this stock item.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            {/* Stock Type Information */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {getStockTypeIcon()}
                  <span className="font-medium text-blue-800">{getStockTypeLabel()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Supplier</Label>
                <p className="font-medium">{stock.supplier}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Base Price</Label>
                <p className="font-medium">₹{stock.basePrice}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Min Order</Label>
                <p className="font-medium">{stock.minOrderQuantity} pieces</p>
              </div>
            </div>

            <Separator />

            {/* Dynamic Content Based on Stock Type */}
            {stock.itemSetType === 'set_of_pattern' && renderSetOfPatternView()}
            {stock.itemSetType === 'single_color' && renderSetOfSizesView()}
            {stock.itemSetType === 'individual_flex' && renderFlexibleView()}

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special requirements or notes for the supplier..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {/* Order Summary */}
            {renderSummary()}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedCombinations.length > 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {selectedCombinations.length} combinations selected
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                No items selected
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedCombinations.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
