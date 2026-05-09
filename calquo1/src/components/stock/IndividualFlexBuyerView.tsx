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

interface IndividualFlexBuyerViewProps {
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
  selectedQuantity: number;
  pricePerUnit: number;
}

export function IndividualFlexBuyerView({ stock, onAddToCart }: IndividualFlexBuyerViewProps) {
  const [selections, setSelections] = useState<CombinationSelection[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (combinationId: string, quantity: number) => {
    const combination = stock.combinations.find(c => c.combinationId === combinationId);
    if (!combination) return;

    const availableQuantity = combination.availableQuantity || 0;
    const finalQuantity = Math.min(Math.max(0, quantity), availableQuantity);

    setSelections(prev => {
      const existing = prev.find(s => s.combinationId === combinationId);
      if (existing) {
        if (finalQuantity === 0) {
          return prev.filter(s => s.combinationId !== combinationId);
        }
        return prev.map(s => s.combinationId === combinationId ? { ...s, selectedQuantity: finalQuantity } : s);
      }
      
      if (finalQuantity === 0) return prev;

      return [...prev, {
        combinationId,
        colorId: combination.colorId,
        sizeId: combination.sizeId,
        colorName: combination.colorName,
        sizeName: combination.sizeName,
        selectedQuantity: finalQuantity,
        pricePerUnit: stock.basePrice
      }];
    });
  };

  const totalQuantity = selections.reduce((sum, s) => sum + s.selectedQuantity, 0);
  const totalPrice = selections.reduce((sum, s) => sum + (s.selectedQuantity * s.pricePerUnit), 0);

  const handleAddToCart = () => {
    if (totalQuantity < (stock.minOrderQuantity || 1)) {
      toast.error(`Minimum order quantity is ${stock.minOrderQuantity}`);
      return;
    }

    setLoading(true);
    if (onAddToCart) {
      onAddToCart(selections.map(s => ({
        combinationId: s.combinationId,
        colorId: s.colorId,
        sizeId: s.sizeId,
        quantity: s.selectedQuantity,
        pricePerUnit: s.pricePerUnit
      })));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
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
            <span>Min Order: {stock.minOrderQuantity}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3 font-medium">Size</th>
                  <th className="p-3 font-medium">Color</th>
                  <th className="p-3 font-medium text-right">Stock</th>
                  <th className="p-3 font-medium text-right">Price</th>
                  <th className="p-3 font-medium text-center w-32">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stock.combinations.map((combination, index) => (
                  <tr key={combination.combinationId} className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="p-3">
                      <Badge variant="outline">{getSafeString(combination.sizeName)}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: combination.colorCode }}
                        />
                        <span>{getSafeString(combination.colorName)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className={combination.availableQuantity < 10 ? 'text-destructive font-medium' : ''}>
                        {combination.availableQuantity}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      ₹{stock.basePrice}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={combination.availableQuantity}
                          value={selections.find(s => s.combinationId === combinationId)?.selectedQuantity || 0}
                          onChange={(e) => handleQuantityChange(combination.combinationId, parseInt(e.target.value) || 0)}
                          className="w-20 text-center h-8"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selections.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="font-medium">Selection Summary</h4>
              <div className="space-y-2">
                {selections.map(selection => (
                  <div key={selection.combinationId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: stock.combinations.find(c => c.combinationId === selection.combinationId)?.colorCode }}
                      />
                      <span className="text-sm">
                        {getSafeString(selection.sizeName)} - {getSafeString(selection.colorName)} × {selection.selectedQuantity}
                      </span>
                    </div>
                    <span>₹{(selection.selectedQuantity * selection.pricePerUnit).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex items-center justify-between font-bold">
                <span>Total ({totalQuantity} items)</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              
              {totalQuantity < (stock.minOrderQuantity || 1) && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Please add at least {stock.minOrderQuantity - totalQuantity} more items to meet minimum order quantity.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                disabled={loading || totalQuantity < (stock.minOrderQuantity || 1)}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add {totalQuantity} items to Cart
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
