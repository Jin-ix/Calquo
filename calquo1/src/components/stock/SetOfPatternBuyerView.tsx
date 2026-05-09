import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  EnhancedStockItem, 
} from './EnhancedStockTypes';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Local helper as a fallback to prevent "is not a function" errors
const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};

interface SetOfPatternBuyerViewProps {
  stock: EnhancedStockItem;
  onAddToCart?: (selections: Array<{
    combinationId: string;
    colorId: string;
    sizeId: string;
    quantity: number;
    pricePerUnit: number;
  }>) => void;
}

interface CombinationSelection {
  combinationId: string;
  colorId: string;
  sizeId: string;
  colorName: string;
  sizeName: string;
  availableQuantity: number;
  selectedQuantity: number;
  pricePerUnit: number;
  images: string[];
}

export function SetOfPatternBuyerView({ stock, onAddToCart }: SetOfPatternBuyerViewProps) {
  const [selections, setSelections] = useState<CombinationSelection[]>([]);

  // Prepare combinations for display
  const combinationsDisplay = stock.combinations.map(combination => {
    const color = stock.colors.find(c => c.id === combination.colorId);
    const size = stock.sizes.find(s => s.id === combination.sizeId);
    
    return {
      combinationId: combination.combinationId || (combination as any).id,
      colorId: combination.colorId,
      sizeId: combination.sizeId,
      colorName: color?.name || 'Unknown',
      sizeName: size?.displayName || 'Unknown',
      availableQuantity: combination.availableQuantity || (combination as any).quantity || 0,
      pricePerUnit: stock.basePrice || (stock as any).price || 0,
      images: combination.images || []
    };
  });

  const handleQuantityChange = (combinationId: string, quantity: number) => {
    const combination = combinationsDisplay.find(c => c.combinationId === combinationId);
    if (!combination) return;

    let finalQuantity = quantity;
    if (finalQuantity < 0) finalQuantity = 0;
    if (finalQuantity > combination.availableQuantity) {
      toast.error(`Maximum available: ${combination.availableQuantity}`);
      finalQuantity = combination.availableQuantity;
    }

    setSelections(prev => {
      const existing = prev.find(s => s.combinationId === combinationId);
      if (finalQuantity === 0) {
        // Remove selection if quantity is 0
        return prev.filter(s => s.combinationId !== combinationId);
      }
      
      if (existing) {
        // Update existing selection
        return prev.map(s => 
          s.combinationId === combinationId 
            ? { ...s, selectedQuantity: finalQuantity }
            : s
        );
      } else {
        // Add new selection
        return [...prev, {
          combinationId,
          colorId: combination.colorId,
          sizeId: combination.sizeId,
          colorName: combination.colorName,
          sizeName: combination.sizeName,
          availableQuantity: combination.availableQuantity,
          selectedQuantity: finalQuantity,
          pricePerUnit: combination.pricePerUnit,
          images: combination.images
        }];
      }
    });
  };

  const getSelectedQuantity = (combinationId: string) => {
    return selections.find(s => s.combinationId === combinationId)?.selectedQuantity || 0;
  };

  const totalAmount = selections.reduce((sum, s) => sum + (s.selectedQuantity * s.pricePerUnit), 0);
  const totalQuantity = selections.reduce((sum, s) => sum + s.selectedQuantity, 0);

  const handleAddToCart = () => {
    if (selections.length === 0) {
      toast.error('Please select at least one combination');
      return;
    }

    const cartSelections = selections.map(s => ({
      combinationId: s.combinationId,
      colorId: s.colorId,
      sizeId: s.sizeId,
      quantity: s.selectedQuantity,
      pricePerUnit: s.pricePerUnit
    }));

    onAddToCart?.(cartSelections);
    toast.success('Added to cart successfully!');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {getSafeString(stock.name)}
          <Badge variant="outline" className="ml-auto">
            Set of Pattern
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Supplier: {getSafeString(stock.supplier)}</span>
          <span>Location: {getSafeString(stock.location)}</span>
          <span>Min Order: {stock.minOrderQuantity || 1}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Availability Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Select the combinations you want to add to your order.
          </AlertDescription>
        </Alert>

        {/* Available Combinations Table */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Available Combinations</Label>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs md:text-sm">
                <tr>
                  <th className="text-left p-2 md:p-3 font-medium">Pattern/Color</th>
                  <th className="text-left p-2 md:p-3 font-medium">Size</th>
                  <th className="text-left p-2 md:p-3 font-medium">Available</th>
                  <th className="text-left p-2 md:p-3 font-medium">Price/Unit</th>
                  <th className="text-left p-2 md:p-3 font-medium">Quantity</th>
                  <th className="text-left p-2 md:p-3 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {combinationsDisplay.map((combination, index) => {
                  const selectedQty = getSelectedQuantity(combination.combinationId);
                  const subtotal = selectedQty * combination.pricePerUnit;
                  
                  return (
                    <tr key={combination.combinationId} className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-2 md:p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: stock.colors.find(c => c.id === combination.colorId)?.colorCode }}
                          />
                          <span className="truncate max-w-[80px] md:max-w-none">{getSafeString(combination.colorName)}</span>
                        </div>
                      </td>
                      <td className="p-2 md:p-3">
                        <Badge variant="outline">{getSafeString(combination.sizeName)}</Badge>
                      </td>
                      <td className="p-2 md:p-3">
                        <Badge variant={combination.availableQuantity > 0 ? "default" : "destructive"}>
                          {combination.availableQuantity}
                        </Badge>
                      </td>
                      <td className="p-2 md:p-3">₹{combination.pricePerUnit}</td>
                      <td className="p-2 md:p-3">
                        <Input
                          type="number"
                          min="0"
                          max={combination.availableQuantity}
                          value={selectedQty}
                          onChange={(e) => handleQuantityChange(combination.combinationId, parseInt(e.target.value) || 0)}
                          className="w-16 md:w-20 h-8"
                          disabled={combination.availableQuantity === 0}
                        />
                      </td>
                      <td className="p-2 md:p-3 font-medium">
                        ₹{subtotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selection Summary */}
        {selections.length > 0 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Your Selection</Label>
            
            <div className="border rounded-lg p-3 md:p-4 bg-muted/20">
              <div className="space-y-2">
                {selections.map(selection => (
                  <div key={selection.combinationId} className="flex items-center justify-between text-sm">
                    <span>
                      {getSafeString(selection.colorName)} - {getSafeString(selection.sizeName)}
                    </span>
                    <span>
                      {selection.selectedQuantity} × ₹{selection.pricePerUnit} = ₹{(selection.selectedQuantity * selection.pricePerUnit).toLocaleString()}
                    </span>
                  </div>
                ))}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total ({totalQuantity} units)</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            onClick={handleAddToCart}
            disabled={selections.length === 0 || totalQuantity < (stock.minOrderQuantity || 1)}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
            {selections.length > 0 && ` (₹${totalAmount.toLocaleString()})`}
          </Button>
          
          {totalQuantity < (stock.minOrderQuantity || 1) && totalQuantity > 0 && (
            <Alert className="flex-1 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Min order: {stock.minOrderQuantity} units. Missing: {stock.minOrderQuantity - totalQuantity}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
