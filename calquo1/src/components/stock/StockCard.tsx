import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Package, MapPin, Calendar, DollarSign, ChevronLeft, ChevronRight, Tag, Clock, ShoppingCart, X, Edit3, Shirt, Info, ChevronDown, ChevronUp, TrendingUp, Plus } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { getEffectivePrice, EnhancedStockItem } from './EnhancedStockTypes';
import { motion } from 'framer-motion';
import { resolveImageUrl } from '../../utils/imageUtils';

import { SizeDetails } from './SizeChartSelector';

// Local helper as a fallback to prevent "is not a function" errors
const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};

export interface Variant {
  color: string;
  size: string;
  quantity: number;
  imageUrl?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  hsnCode?: string; // HSN code for GST classification
  size: string; // Legacy field - keep for backward compatibility
  sizeDetails?: SizeDetails; // New comprehensive size information
  color: string;
  quantity: number;
  price: number; // Legacy field - keep for backward compatibility
  mrp?: number; // Maximum Retail Price
  singleShopPrice?: number; // Price for single shop retailers
  multiShopPrice?: number;  // Price for multi shop retailers
  dealerPrice?: number; // Price for dealers/wholesalers
  retailerPrice?: number; // Price for retailers
  supplier: string;
  sellerId?: string;
  supplierType: 'manufacturer' | 'trader';
  location: string;
  dateAdded: string;
  minOrderQuantity: number;
  description?: string;
  fabricType: string; // Mandatory fabric type
  fabricDescription: string; // Mandatory fabric description
  vtonImageUrl?: string; // Virtual Try-On subject image
  images: string[]; // Array of 3-5 image URLs
  mainImageIndex?: number; // Index of the main image in the images array
  videos?: Array<{
    url: string;
    duration: number; // in seconds
    thumbnail?: string;
  }>; // Array of product videos
  // ERP Basic Fields
  itemCode?: string; // Auto-generated item code (e.g., G1538)
  unitOfMeasure?: string; // Unit of measure (BAG, ROLL, BAL, PCS, etc.)
  unitMode?: 'individual' | 'bulk'; // Unit mode - individual units vs bulk sets
  batchCode?: string; // Batch/lot code for tracking
  // Special offer pricing
  offerPrice?: number; // Special discounted price
  offerType?: 'time' | 'quantity'; // Type of offer
  offerTimeWeeks?: number; // Duration in weeks for time-based offers
  offerMinQuantity?: number; // Minimum quantity for quantity-based offers
  offerValidUntil?: string; // ISO date string for when offer expires
  offerCreatedDate?: string; // ISO date string for when offer was created
  // Trending feature for admin
  isTrending?: boolean; // Whether item is marked as trending by admin
  trendingText?: string; // Short text (up to 10 words) to display with trending items
  trendingSetDate?: string; // ISO date string for when trending was set
  // Delivery time information
  deliveryTime?: '5-10 days' | '10-20 days' | 'more than 1 month'; // Expected delivery duration
  // Purchase restriction
  sellingType?: 'set' | 'individual'; // Whether item must be sold as complete set or individual variants allowed
  tradersOnly?: boolean; // Whether item is available only for traders, not retailers
  selectedTraders?: string[]; // Array of trader IDs that can access this item when tradersOnly is true
  // Variant information
  variants?: Variant[]; // Array of all product variants
  variantMode?: 'color-first' | 'size-first' | 'mixed'; // How variants were created
  quantityMode?: 'each-variant' | 'total-across'; // How quantity is applied
}

interface StockCardProps {
  stock: StockItem;
  onOrder?: (stock: StockItem) => void;
  onEdit?: (stock: StockItem) => void;
  onRemoveOffer?: (stockId: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
  showAddToCart?: boolean;
}

export function StockCard({
  stock,
  onOrder,
  onEdit,
  onRemoveOffer,
  showActions = true,
  isOwner = false,
  showAddToCart = true
}: StockCardProps) {
  const { user } = useAuth();
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const [showFabricDescription, setShowFabricDescription] = useState(false);
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Determine the appropriate price to display based on user role and retailer type
  const getDisplayPrice = () => {
    // Utilize the shared, centralized getEffectivePrice instead of duplicative logic natively
    const effectivePrice = getEffectivePrice(
      stock as unknown as EnhancedStockItem,
      user?.role,
      user?.profile?.retailerType
    );
    return effectivePrice || stock.price || 0;
  };

  const displayPrice = getDisplayPrice();

  // Check if offer is valid and applicable
  const isOfferValid = () => {
    if (!stock.offerPrice || !stock.offerType) return false;

    if (stock.offerType === 'time' && stock.offerValidUntil) {
      return new Date() < new Date(stock.offerValidUntil);
    }

    if (stock.offerType === 'quantity' && stock.offerMinQuantity) {
      return true; // Quantity offers are always valid until removed
    }

    return false;
  };

  const offerValid = isOfferValid();
  const finalPrice = offerValid ? stock.offerPrice! : displayPrice;
  const hasDiscount = offerValid && stock.offerPrice! < displayPrice;

  // Calculate days remaining for time-based offers
  const getDaysRemaining = () => {
    if (stock.offerType === 'time' && stock.offerValidUntil) {
      const now = new Date();
      const validUntil = new Date(stock.offerValidUntil);
      const diffTime = validUntil.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  // Cart functionality
  const cartQuantity = getCartItemQuantity(stock.id);
  const inCart = isInCart(stock.id);
  const canAddToCart = user?.role === 'retailer' || user?.role === 'trader';

  // Check if retailer can access this item
  const isTraderOnlyItem = stock.tradersOnly;
  const isRetailerBlocked = isTraderOnlyItem && user?.role === 'retailer';

  const handleAddToCart = () => {
    if (!canAddToCart || isRetailerBlocked) return;
    addToCart(stock as any, stock.minOrderQuantity || 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className={`h-full relative overflow-hidden transition-shadow duration-300 group-hover:shadow-2xl flex flex-col ${hasDiscount ? 'ring-2 ring-orange-400 bg-gradient-to-br from-orange-50/80 to-yellow-50/80 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm shadow-md border-slate-200/60'}`}>

        {/* Subtle top highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Product Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          {stock.images && stock.images.length > 0 ? (
            <ImageWithFallback
              src={resolveImageUrl(stock.images[stock.mainImageIndex || 0])}
              alt={getSafeString(stock.name)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
              <Package className="h-10 w-10 opacity-20" strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 mt-2">No Image</span>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          {/* Trader-Only Banner */}
          {isTraderOnlyItem && (
            <div className="mb-3 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                <span>TRADERS ONLY</span>
                <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                  Exclusive for Traders
                </span>
              </div>
            </div>
          )}

          {/* Trending Banner */}
          {stock.isTrending && (
            <div className="mb-3 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>TRENDING</span>
                {stock.trendingText && (
                  <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                    {stock.trendingText}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Special Offer Banner */}
          {offerValid && (
            <div className="mb-3 p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md">
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>SPECIAL OFFER</span>
                </div>
                <div className="flex items-center gap-3">
                  {stock.offerType === 'time' && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{getDaysRemaining()} days left</span>
                    </div>
                  )}
                  {stock.offerType === 'quantity' && (
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span>Min {stock.offerMinQuantity} pcs</span>
                    </div>
                  )}
                  {/* Remove offer button for owners */}
                  {isOwner && onRemoveOffer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOffer(stock.id)}
                      className="h-6 w-6 p-0 hover:bg-red-600 text-white hover:text-white"
                      title="Remove offer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Owner offer management for expired/no offers */}
          {isOwner && !offerValid && stock.offerPrice && (
            <div className="mb-3">
              <div className="p-2 bg-gray-100 border border-gray-300 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="h-4 w-4" />
                    <span>Offer Expired</span>
                  </div>
                  {onRemoveOffer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOffer(stock.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 text-gray-600"
                      title="Remove expired offer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{getSafeString(stock.name)}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stock.description}</p>
            </div>
            <Badge variant={stock.quantity > 50 ? 'default' : stock.quantity > 10 ? 'secondary' : 'destructive'}>
              {stock.quantity} pcs
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <p>{getSafeString(stock.category)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              {stock.sizeDetails ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getSafeString(stock.sizeDetails.size)}</p>
                    <Badge variant="outline" className="text-xs">
                      {stock.sizeDetails.ageCategory}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {stock.sizeDetails.genderCategory} • {stock.sizeDetails.sizeType}
                  </p>
                </div>
              ) : (
                <p>{getSafeString(stock.size)}</p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Color:</span>
              <p>{getSafeString(stock.color)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Min Order:</span>
              <p>{stock.minOrderQuantity} pcs</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  <span className="text-muted-foreground">Fabric:</span>
                  <span className="font-medium">{getSafeString(stock.fabricType)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFabricDescription(!showFabricDescription)}
                  className="h-6 w-6 p-0"
                  title={showFabricDescription ? 'Hide fabric details' : 'Show fabric details'}
                >
                  <Info className="h-3 w-3" />
                </Button>
              </div>
              {showFabricDescription && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                  <p className="text-muted-foreground">{stock.fabricDescription}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              <span className="text-muted-foreground">Price per piece:</span>
              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <span className="font-bold text-orange-600 text-lg">{formatCurrency(finalPrice)}</span>
                    <span className="line-through text-muted-foreground text-sm">{formatCurrency(displayPrice)}</span>
                    <Badge variant="destructive" className="text-xs">
                      {Math.round(((displayPrice - finalPrice) / displayPrice) * 100)}% OFF
                    </Badge>
                  </>
                ) : (
                  <span className="font-medium">{formatCurrency(finalPrice)}</span>
                )}
              </div>
            </div>

            {/* Offer details */}
            {offerValid && (
              <div className="pl-6 space-y-1">
                {stock.offerType === 'time' && (
                  <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Limited time offer - {getDaysRemaining()} days remaining!</span>
                  </div>
                )}
                {stock.offerType === 'quantity' && (
                  <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    <span>Bulk discount - Minimum order: {stock.offerMinQuantity} pieces</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              <span className="text-muted-foreground">Supplier:</span>
              <span>{getSafeString(stock.supplier)}</span>
              <Badge variant="outline" className="text-xs">
                {stock.supplierType}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span className="text-muted-foreground">Location:</span>
              <span>{getSafeString(stock.location)}</span>
            </div>

            {stock.deliveryTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className="text-muted-foreground">Delivery:</span>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {stock.deliveryTime}
                </Badge>
              </div>
            )}
          </div>

          {showActions && (
            <div className="space-y-2 pt-2">
              {isRetailerBlocked && !isOwner && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                    <Package className="h-4 w-4" />
                    <span>Item available only for traders</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This product is exclusively available for trader accounts.
                  </p>
                </div>
              )}

              {!isRetailerBlocked && (
                <div className="flex gap-2">
                  {!isOwner && canAddToCart && showAddToCart && (
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={stock.quantity < (stock.minOrderQuantity || 1)}
                    >
                      <Plus className="h-4 w-4" />
                      {inCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                    </Button>
                  )}

                  {!isOwner && onOrder && (
                    <Button
                      onClick={() => onOrder(stock)}
                      className={`flex-1 ${hasDiscount ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      disabled={stock.quantity < (stock.minOrderQuantity || 1)}
                    >
                      Send Request
                    </Button>
                  )}
                </div>
              )}

              {isOwner && onEdit && (
                <Button
                  onClick={() => onEdit(stock)}
                  variant="outline"
                  className="w-full"
                >
                  Edit Stock
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
