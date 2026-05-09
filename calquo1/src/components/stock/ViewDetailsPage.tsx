import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '../cart/CartProvider';
import { toast } from 'sonner';

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  available: boolean;
}

interface SizeOption {
  size: string;
  boxQuantity: number;
  pricePerPiece: number;
  pricePerBox: number;
  stockCount: number;
}

interface PackOption {
  id: string;
  label: string;
  quantity: number;
  isPopular?: boolean;
}

interface ProductData {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  colors: ColorOption[];
  sizes: SizeOption[];
  packOptions: PackOption[];
  basePrice: number;
  gstRate: number;
  hsnCode: string;
  fabric: string;
  brand: string;
  images: string[];
}

interface ViewDetailsPageProps {
  product: ProductData;
  onBack?: () => void;
}

export function ViewDetailsPage({ product, onBack }: ViewDetailsPageProps) {
  const { addToCart } = useCart();
  const [selectedPack, setSelectedPack] = useState<string>(product.packOptions[1]?.id || product.packOptions[0]?.id || '');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.id || '');
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});

  // Update quantity for a specific size
  const updateSizeQuantity = (size: string, change: number) => {
    setSizeQuantities(prev => {
      const currentQty = prev[size] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      // Check stock availability
      const sizeOption = product.sizes.find(s => s.size === size);
      if (sizeOption && newQty > sizeOption.stockCount) {
        toast.error(`Only ${sizeOption.stockCount} boxes available for size ${size}`);
        return prev;
      }
      
      return {
        ...prev,
        [size]: newQty
      };
    });
  };

  // Calculate totals
  const totals = useMemo(() => {
    let totalBoxes = 0;
    let totalPrice = 0;
    let totalPieces = 0;

    product.sizes.forEach(sizeOption => {
      const quantity = sizeQuantities[sizeOption.size] || 0;
      totalBoxes += quantity;
      totalPrice += quantity * sizeOption.pricePerBox;
      totalPieces += quantity * sizeOption.boxQuantity;
    });

    return { totalBoxes, totalPrice, totalPieces };
  }, [sizeQuantities, product.sizes]);

  // Get selected pack details
  const selectedPackOption = product.packOptions.find(pack => pack.id === selectedPack);
  const selectedColorOption = product.colors.find(color => color.id === selectedColor);

  // Handle add to cart
  const handleAddToCart = () => {
    const hasSelection = Object.values(sizeQuantities).some(qty => qty > 0);
    
    if (!hasSelection) {
      toast.error('Please select at least one item');
      return;
    }

    // Prepare cart items for each size with quantity > 0
    const cartItems = product.sizes
      .filter(sizeOption => (sizeQuantities[sizeOption.size] || 0) > 0)
      .map(sizeOption => ({
        id: `${product.id}-${sizeOption.size}-${selectedColor}`,
        name: `${product.title} - Size ${sizeOption.size}`,
        price: sizeOption.pricePerBox,
        quantity: sizeQuantities[sizeOption.size],
        image: product.images[0] || '',
        variant: `${sizeOption.size} / ${selectedColorOption?.name || 'Default'}`,
        boxQuantity: sizeOption.boxQuantity,
        supplierId: 'supplier-1', // This should come from actual data
      }));

    cartItems.forEach(item => {
      addToCart(item);
    });

    toast.success(`Added ${totals.totalBoxes} boxes (${totals.totalPieces} pieces) to cart`);
    
    // Reset selections
    setSizeQuantities({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header Section */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Back button */}
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          {/* Product Title */}
          <h1 className="text-xl font-medium text-foreground mb-2 text-center">
            {product.title.toLowerCase()}
          </h1>
          
          {product.subtitle && (
            <p className="text-sm text-muted-foreground text-center mb-6">
              {product.subtitle}
            </p>
          )}

          {/* Pack Selection Buttons */}
          <div className="space-y-3 mb-8">
            {product.packOptions.map((pack) => (
              <Button
                key={pack.id}
                variant={selectedPack === pack.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedPack(pack.id)}
                className={`
                  w-full rounded-full py-3 text-sm font-medium transition-all duration-200
                  ${selectedPack === pack.id 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'bg-background text-foreground border-border hover:border-foreground/20'
                  }
                `}
              >
                {pack.label}
              </Button>
            ))}
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="text-sm text-muted-foreground mb-4">Color :</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => color.available && setSelectedColor(color.id)}
                  disabled={!color.available}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-all duration-200
                    ${selectedColor === color.id 
                      ? 'border-foreground scale-110 shadow-md' 
                      : 'border-border hover:border-foreground/30'
                    }
                    ${!color.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name}${!color.available ? ' (Out of Stock)' : ''}`}
                >
                  {selectedColor === color.id && (
                    <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stock & Pricing Display */}
          <div className="flex justify-between items-center mb-8 text-sm">
            <div>
              <span className="font-medium text-foreground">Total Box: </span>
              <span className="font-medium">{totals.totalBoxes}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Total price: </span>
              <span className="font-medium">Rs. {totals.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Size & Quantity Section */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {product.sizes.map((sizeOption) => {
            const currentQty = sizeQuantities[sizeOption.size] || 0;
            const isOutOfStock = sizeOption.stockCount === 0;
            
            return (
              <div key={sizeOption.size} className={`${isOutOfStock ? 'opacity-60' : ''}`}>
                {/* Box Info */}
                <div className="mb-3">
                  <p className="text-sm text-foreground font-medium">
                    Box of {sizeOption.boxQuantity} T-Shirt
                  </p>
                </div>

                {/* Size and Price Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-foreground">Size: {sizeOption.size}</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{sizeOption.pricePerPiece}/Piece
                    </span>
                  </div>
                </div>

                {/* Quantity Controls and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-foreground font-medium">Quantity(Box)</span>
                    
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSizeQuantity(sizeOption.size, -1)}
                        disabled={currentQty === 0 || isOutOfStock}
                        className="h-8 w-8 p-0 rounded-full border-muted-foreground/30"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-12 text-center text-sm bg-background border border-border rounded px-2 py-1">
                        {currentQty}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSizeQuantity(sizeOption.size, 1)}
                        disabled={currentQty >= sizeOption.stockCount || isOutOfStock}
                        className="h-8 w-8 p-0 rounded-full border-muted-foreground/30"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      Price per Box
                    </div>
                    <div className="text-sm font-medium">
                      Rs. {sizeOption.pricePerBox.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="mt-2">
                  <Badge 
                    variant={isOutOfStock ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {isOutOfStock ? 'Out of Stock' : `${sizeOption.stockCount} In stock`}
                  </Badge>
                </div>

                {/* Divider */}
                {product.sizes.indexOf(sizeOption) < product.sizes.length - 1 && (
                  <hr className="mt-6 border-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Section */}
      <div className="sticky bottom-0 bg-card border-t border-border p-6 z-10">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={handleAddToCart}
            disabled={totals.totalBoxes === 0}
            size="lg"
            className="w-full rounded-full py-3 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {totals.totalBoxes > 0 
              ? `Add ${totals.totalBoxes} boxes to Cart (₹${totals.totalPrice.toLocaleString()})`
              : 'Add to Cart'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
