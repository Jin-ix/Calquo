import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ItemSet } from './ItemSetTypes';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { MapPin, Package, Star, Heart, ShoppingCart, Plus, Minus, Calculator, Clock, Gift } from 'lucide-react';

interface ItemSetCardProps {
  itemSet: ItemSet;
  onOrderSet?: (orderData: {
    itemSetId: string;
    setName: string;
    numberOfSets: number;
    pricePerSet: number;
    totalAmount: number;
    buyerCompany: string;
    buyerEmail: string;
    buyerPhone: string;
    supplierName: string;
    supplierLocation: string;
    setDetails: {
      color: string;
      sizeBreakdown: typeof itemSet.sizeQuantities;
      totalPiecesPerSet: number;
      totalPiecesOrdered: number;
    };
  }) => void;
  onEdit?: (itemSet: ItemSet) => void;
  onRemoveOffer?: (itemSetId: string) => void;
  showOwnerActions?: boolean;
  isPreferredSupplier?: boolean;
  showAddToCart?: boolean;
}

export function ItemSetCard({ 
  itemSet, 
  onOrderSet, 
  onEdit, 
  onRemoveOffer,
  showOwnerActions = false,
  isPreferredSupplier = false,
  showAddToCart = true
}: ItemSetCardProps) {
  const { user } = useAuth();
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const [selectedSets, setSelectedSets] = useState(itemSet.minOrderSets);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const effectivePrice = itemSet.offerPrice || itemSet.setPrice;
  const totalOrderAmount = effectivePrice * selectedSets;
  const totalPiecesOrdered = itemSet.totalPiecesInSet * selectedSets;
  
  const isOfferValid = itemSet.offerValidUntil ? new Date(itemSet.offerValidUntil) > new Date() : true;
  const showOffer = itemSet.offerPrice && isOfferValid;

  // Cart functionality
  const canAddToCart = user?.role === 'retailer' || user?.role === 'trader';
  const cartQuantity = getCartItemQuantity(itemSet.id);
  const inCart = isInCart(itemSet.id);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    
    // Create a mock StockItem for the item set
    const stockItemForCart = {
      id: itemSet.id,
      name: itemSet.name,
      category: itemSet.category,
      size: 'Set',
      color: itemSet.color,
      quantity: 999, // Assuming sets are available
      price: effectivePrice,
      singleShopPrice: effectivePrice,
      multiShopPrice: effectivePrice,
      supplier: itemSet.supplier,
      supplierType: 'manufacturer' as const,
      location: itemSet.location,
      dateAdded: itemSet.dateAdded,
      minOrderQuantity: itemSet.minOrderSets,
      description: itemSet.description,
      fabricType: 'Mixed',
      fabricDescription: 'Item set with multiple pieces',
      images: itemSet.images
    };

    addToCart(
      stockItemForCart,
      itemSet.minOrderSets,
      true, // isItemSet
      itemSet.minOrderSets, // numberOfSets
      effectivePrice,
      {
        color: itemSet.color,
        sizeBreakdown: itemSet.sizeQuantities,
        totalPiecesPerSet: itemSet.totalPiecesInSet,
        totalPiecesOrdered: itemSet.totalPiecesInSet * itemSet.minOrderSets
      }
    );
  };

  const handleOrder = () => {
    if (!onOrderSet || !user) return;

    onOrderSet({
      itemSetId: itemSet.id,
      setName: itemSet.name,
      numberOfSets: selectedSets,
      pricePerSet: effectivePrice,
      totalAmount: totalOrderAmount,
      buyerCompany: user.company || '',
      buyerEmail: user.email || '',
      buyerPhone: user.phone || '',
      supplierName: itemSet.supplier,
      supplierLocation: itemSet.location,
      setDetails: {
        color: itemSet.color,
        sizeBreakdown: itemSet.sizeQuantities,
        totalPiecesPerSet: itemSet.totalPiecesInSet,
        totalPiecesOrdered: totalPiecesOrdered
      }
    });

    setShowOrderForm(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % itemSet.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + itemSet.images.length) % itemSet.images.length);
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${isPreferredSupplier ? 'preferred-supplier ring-2 ring-primary/20' : ''}`}>
      {isPreferredSupplier && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="default" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <Heart className="h-3 w-3 fill-current" />
            Preferred
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight">{itemSet.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{itemSet.category}</Badge>
              <Badge variant="outline">{itemSet.color}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{itemSet.location}</span>
          <span>•</span>
          <span>{itemSet.supplier}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Gallery */}
        {itemSet.images.length > 0 && (
          <div className="relative">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
              <img
                src={itemSet.images[currentImageIndex]}
                alt={`${itemSet.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {itemSet.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-80 hover:opacity-100"
                    onClick={prevImage}
                  >
                    ←
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-80 hover:opacity-100"
                    onClick={nextImage}
                  >
                    →
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {itemSet.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Set Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium">Set Configuration:</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {itemSet.sizeQuantities.map((sq, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-xs font-medium">{sq.sizeDetails.size}</span>
                <Badge variant="outline" className="text-xs">{sq.quantity} pcs</Badge>
              </div>
            ))}
          </div>
          
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total per set:</span>
              <Badge variant="default" className="gap-1">
                <Calculator className="h-3 w-3" />
                {itemSet.totalPiecesInSet} pieces
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Price per Set:</span>
            <div className="text-right">
              {showOffer ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">₹{itemSet.offerPrice?.toLocaleString()}</span>
                    <Badge variant="destructive" className="gap-1">
                      <Gift className="h-3 w-3" />
                      OFFER
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground line-through">₹{itemSet.setPrice.toLocaleString()}</span>
                  {itemSet.offerType === 'time' && itemSet.offerValidUntil && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(itemSet.offerValidUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-lg font-bold">₹{itemSet.setPrice.toLocaleString()}</span>
              )}
              <div className="text-xs text-muted-foreground">
                ₹{(effectivePrice / itemSet.totalPiecesInSet).toFixed(2)} per piece
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Min order: {itemSet.minOrderSets} sets
          </div>
        </div>

        {/* Description */}
        {itemSet.description && (
          <p className="text-sm text-muted-foreground">{itemSet.description}</p>
        )}

        {/* Owner Actions */}
        {showOwnerActions && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit?.(itemSet)}>
              Edit Set
            </Button>
            {showOffer && (
              <Button variant="outline" size="sm" onClick={() => onRemoveOffer?.(itemSet.id)}>
                Remove Offer
              </Button>
            )}
          </div>
        )}

        {/* Order Form */}
        {!showOwnerActions && (
          <div className="space-y-3">
            {!showOrderForm ? (
              <div className="flex gap-2">
                {/* Add to Cart Button */}
                {canAddToCart && showAddToCart && (
                  <Button 
                    onClick={handleAddToCart}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {inCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                  </Button>
                )}
                
                {/* Direct Order Button */}
                <Button 
                  onClick={() => setShowOrderForm(true)} 
                  className="flex-1 gap-2"
                  disabled={!onOrderSet}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Order Sets
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label>Number of Sets:</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedSets(Math.max(itemSet.minOrderSets, selectedSets - 1))}
                      disabled={selectedSets <= itemSet.minOrderSets}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={itemSet.minOrderSets}
                      value={selectedSets}
                      onChange={(e) => setSelectedSets(Math.max(itemSet.minOrderSets, parseInt(e.target.value) || itemSet.minOrderSets))}
                      className="w-20 h-8 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedSets(selectedSets + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sets: {selectedSets}</span>
                    <span>₹{effectivePrice.toLocaleString()} each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total pieces:</span>
                    <span>{totalPiecesOrdered} pieces</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total amount:</span>
                    <span>₹{totalOrderAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowOrderForm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleOrder} className="flex-1">
                    Confirm Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
