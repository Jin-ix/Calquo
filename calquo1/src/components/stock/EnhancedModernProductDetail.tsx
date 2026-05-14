import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Edit, Trash2, Printer, RefreshCw,
  Package, Check, Building, MapPin,
  TrendingUp, Info, Share2, ShoppingCart, Send,
  CreditCard, Truck, Shirt, Barcode, Calendar, Star,
  Plus, Minus, AlertCircle, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

import { StockItem } from './StockCard';
import { EnhancedStockItem, getEffectivePrice } from './EnhancedStockTypes';
import { useAuth } from '../auth/AuthProvider';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { MultiStepCheckout, CheckoutData } from '../orders/MultiStepCheckout';
import { notificationService } from '../../utils/firebase/notificationService';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { PurchaseRequestDebug } from './PurchaseRequestDebug';
import { VirtualTryOn } from '../vton/VirtualTryOn';

// Types for props
interface ProductDetailProps {
  product: StockItem | EnhancedStockItem;
  onBack: () => void;
  onPurchaseRequest?: (request: any) => void;
  onAddToCart?: (variants: Array<any>) => void;
}

// Helper for Type Guard
const isEnhancedStock = (product: StockItem | EnhancedStockItem): product is EnhancedStockItem => {
  return 'itemSetType' in product;
};

export function EnhancedModernProductDetail({
  product,
  onBack,
  onPurchaseRequest,
  onAddToCart
}: ProductDetailProps) {
  const { user } = useAuth();

  // DEBUG: Check product image data
  React.useEffect(() => {
    console.log('🔍 [ModernBuyerFocusedProductDetail] Product:', product);
    if (isEnhancedStock(product)) {
      console.log('🌈 Product Colors:', product.colors);
      product.colors?.forEach((c, i) => {
        console.log(`  Color ${i} (${c.name}):`, c.images);
        if (c.patternImage) console.log(`  Color ${i} Pattern:`, c.patternImage);
      });
      console.log('🧩 Product Combinations:', product.combinations);
      console.log('🖼️ Main Images:', product.mainImages);
    } else {
      console.log('📦 Basic Stock Images:', (product as any).images);
    }
  }, [product]);

  // Helper to safely extract string from potentially object fields
  const getSafeString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') {
      return value.name || value.id || 'N/A';
    }
    return String(value);
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showVton, setShowVton] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState('');
  const [bulkSelectQty, setBulkSelectQty] = useState<number>(0);
  const [infoView, setInfoView] = useState<'description' | 'supplier'>('description');

  // Multi-step checkout states
  const [checkoutPhase, setCheckoutPhase] = useState<'summary' | 'checkout'>('summary');
  const [createdRequest, setCreatedRequest] = useState<PurchaseRequest | null>(null);

  // Debug checkout phase changes
  React.useEffect(() => {
    console.log('🎯 Checkout phase changed:', checkoutPhase);
    console.log('📋 Created request:', createdRequest);
  }, [checkoutPhase, createdRequest]);

  // 1. Determine User Role & Ownership
  const isOwner = useMemo(() => {
    if (!user) return false;
    const sellerId = (product as any).sellerId || (product as any).supplierId;
    // Check ID match or Company Name match
    if (sellerId && user.id === sellerId) return true;
    const supplierName = getSafeString(product.supplier);
    if (supplierName && user.profile?.company === supplierName) return true;
    return false;
  }, [user, product]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const canEdit = isOwner || isAdmin;

  // 2. Normalize Product Data
  const images = useMemo(() => {
    const imgs: string[] = [];
    if (isEnhancedStock(product)) {
      if (product.mainImages?.length) imgs.push(...product.mainImages);
      product.colors?.forEach(c => {
        if (c.images?.length) imgs.push(...c.images);
        if (c.patternImage) imgs.push(c.patternImage);
      });
    } else {
      if ((product as any).images?.length) imgs.push(...(product as any).images);
    }
    if (typeof (product as any).image === 'string') imgs.push((product as any).image);
    if (typeof (product as any).imageUrl === 'string') imgs.push((product as any).imageUrl);
    return imgs.length > 0 ? Array.from(new Set(imgs)) : [];
  }, [product]);

  const mainImage = images[0] || '';

  const totalStock = useMemo(() => {
    if (isEnhancedStock(product)) {
      let sum = product.combinations.reduce((sum, c) => sum + c.availableQuantity, 0);
      if (sum === 0 && (product as any).quantity !== undefined) {
        sum = (product as any).quantity;
      }
      return sum;
    }
    return (product as any).quantity || 0;
  }, [product]);

  const minOrderQty = (product as EnhancedStockItem).minOrderQuantity || 1;

  // Stock Status Logic
  let stockStatus = 'Out of Stock';
  let stockColor = 'bg-red-100 text-red-800';

  if (totalStock > minOrderQty * 5) {
    stockStatus = 'In Stock';
    stockColor = 'bg-green-100 text-green-800';
  } else if (totalStock > 0) {
    stockStatus = 'Low Stock';
    stockColor = 'bg-yellow-100 text-yellow-800';
  }

  // Price Logic
  const basePrice = (product as EnhancedStockItem).basePrice || (product as any).price || 0;
  const effectivePrice = getEffectivePrice(
    product as EnhancedStockItem,
    user?.role,
    user?.profile?.retailerType
  );
  const purchasePrice = isOwner ? (basePrice * 0.75) : (effectivePrice || basePrice || (product as any).price); // Mock logic for owner view, otherwise use effective
  const displayPrice = effectivePrice || basePrice || (product as any).price || 0; // The price shown to the user
  const gstRate = 5; // Fixed as per requirements

  // 3. Selection State
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [activeColorId, setActiveColorId] = useState<string>('');

  // Initialize active color
  React.useEffect(() => {
    if (isEnhancedStock(product) && product.colors?.length > 0 && !activeColorId) {
      setActiveColorId(product.colors[0].id);
    }
  }, [product, activeColorId]);

  // Sync bulk quantity changes with all selected items
  React.useEffect(() => {
    if (!isEnhancedStock(product)) return;

    // Update ALL variants to match bulkSelectQty
    const updatedSelections: Record<string, number> = {};
    let hasChanges = false;

    product.combinations.forEach(combo => {
      if (combo.availableQuantity > 0) {
        const key = `${combo.colorId}|${combo.sizeId}`;
        const newQty = Math.min(bulkSelectQty, combo.availableQuantity);

        if (newQty > 0) {
          updatedSelections[key] = newQty;
        }

        // Check if this is different from current selection
        if ((selections[key] || 0) !== newQty) {
          hasChanges = true;
        }
      }
    });

    // Only update state if there are actual changes
    if (hasChanges) {
      setSelections(updatedSelections);
    }
  }, [bulkSelectQty, product, selections]);

  // Handlers
  const handleQuantityChange = (colorId: string, sizeId: string, delta: number, maxStock: number) => {
    const key = `${colorId}|${sizeId}`;
    const currentQty = selections[key] || 0;
    const newQty = Math.max(0, Math.min(maxStock, currentQty + delta));

    setSelections(prev => {
      const next = { ...prev, [key]: newQty };
      if (newQty === 0) delete next[key];
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!isEnhancedStock(product)) return;

    const newSelections: Record<string, number> = {};
    product.combinations.forEach(combo => {
      if (combo.availableQuantity > 0) {
        const key = `${combo.colorId}|${combo.sizeId}`;
        const qtyToSelect = Math.min(bulkSelectQty, combo.availableQuantity);
        newSelections[key] = qtyToSelect;
      }
    });
    setSelections(newSelections);
    toast.success(`Selected ${bulkSelectQty} of each variant (${Object.keys(newSelections).length} variants)`);
  };

  const handleClearAll = () => {
    setSelections({});
    toast.info("Cleared all selections");
  };

  // Helper function to validate MOQ
  const validateMOQ = (): { valid: boolean; message?: string } => {
    const isSetMode = (product as any).itemSetType === 'set_of_pattern'
      || (product as any).bulkSellingMode === 'bulksets'
      || (product as any).unitOfMeasure === 'SET'
      || (product as any).unitMode === 'bulk';

    let effectiveQty = totalSelectedQty;
    if (isSetMode && isEnhancedStock(product)) {
      const sizesCount = product.sizes?.length || 1;
      effectiveQty = Math.floor(totalSelectedQty / sizesCount);
    }

    if (effectiveQty < minOrderQty) {
      const unit = isSetMode ? (minOrderQty === 1 ? 'set' : 'sets') : (minOrderQty === 1 ? 'unit' : 'units');
      return {
        valid: false,
        message: `Minimum order quantity is ${minOrderQty} ${unit}. You have selected ${effectiveQty} ${isSetMode ? (effectiveQty === 1 ? 'set' : 'sets') : (effectiveQty === 1 ? 'unit' : 'units')}.`
      };
    }

    return { valid: true };
  };

  // Handle send purchase request
  const handleSendPurchaseRequest = () => {
    console.log('🔵 handleSendPurchaseRequest called!');
    console.log('User:', user);
    console.log('Selections:', selections);
    console.log('Total Qty:', totalSelectedQty);

    if (!user) {
      console.log('❌ No user logged in');
      toast.error('Please login to send purchase request');
      return;
    }

    if (Object.keys(selections).length === 0 || totalSelectedQty === 0) {
      console.log('❌ No items selected');
      toast.error('Please select at least one item');
      return;
    }

    // Just open the purchase dialog for review
    // Don't create the purchase request yet - that happens after checkout
    console.log('✅ Opening purchase request summary dialog');
    setShowPurchaseDialog(true);
  };

  // Handle checkout completion
  const handleCheckoutComplete = async (data: CheckoutData) => {
    console.log('✅ Checkout completed successfully!', data);

    // Reset states and close dialog
    setShowPurchaseDialog(false);
    setCheckoutPhase('summary');
    setCreatedRequest(null);
    setSelections({});
    setPurchaseNote('');

    // Navigate to dashboard or show success
    toast.success('🎉 Purchase request sent successfully!');
  };

  // Reset checkout phase when dialog closes (but not when moving to checkout)
  React.useEffect(() => {
    if (!showPurchaseDialog && checkoutPhase === 'summary') {
      // Only reset if we're not in checkout phase
      setCreatedRequest(null);
    }
  }, [showPurchaseDialog, checkoutPhase]);

  const totalSelectedQty = Object.values(selections).reduce((a, b) => a + b, 0);
  const totalSelectedPrice = totalSelectedQty * displayPrice;

  // -- Handlers --
  const handleEdit = () => toast.info("Edit functionality coming soon");
  const handleAdjustStock = () => toast.info("Stock adjustment coming soon");
  const handleDelete = () => toast.error("Delete functionality coming soon");
  const handlePrintBarcode = () => toast.success("Printing barcode...");

  const handleAddToCartAction = () => {
    // Basic Add to Cart Implementation
    if (onAddToCart) {
      onAddToCart([{ ...product, quantity: minOrderQty }]); // Add MOQ by default
    }
  };

  // Render Virtual Try-On full screen if active
  if (showVton) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fafafa] overflow-y-auto">
        <VirtualTryOn 
          initialSubjectImage={product.vtonImageUrl}
          onClose={() => setShowVton(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16 font-sans">

      {/* Top Header / Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            <span className="text-sm font-medium text-gray-500 hidden md:block">
              {isOwner ? 'Manage Inventory' : 'Browse Stock'} / Product Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit ? (
              <>
                <Button variant="outline" size="sm" onClick={handlePrintBarcode} className="hidden sm:flex">
                  <Printer className="h-4 w-4 mr-2" /> Barcode
                </Button>
                <Button variant="outline" size="sm" onClick={handleAdjustStock} className="hidden sm:flex">
                  <RefreshCw className="h-4 w-4 mr-2" /> Adjust
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDelete} className="hidden sm:flex h-9 w-9">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5 text-gray-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

          {/* --- LEFT COLUMN: IMAGES --- */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white ring-1 ring-gray-100">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative group">
                {/* Carousel */}
                <Carousel className="w-full h-full" setApi={(api) => {
                  api?.on('select', () => setActiveImageIndex(api.selectedScrollSnap()));
                }}>
                  <CarouselContent>
                    {images.length > 0 ? images.map((img, idx) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-square relative cursor-zoom-in">
                          <ImageWithFallback
                            src={img}
                            alt={`${product.name} - View ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    )) : (
                      <CarouselItem>
                        <div className="aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                          <Package className="h-20 w-20 opacity-20" />
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </Carousel>

                {/* Stock Badge Overlay */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className={cn("px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md border-white/50", stockColor)}>
                    {stockStatus}
                  </Badge>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-t border-gray-100">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-16 h-16 rounded-md border-2 flex-shrink-0 cursor-pointer overflow-hidden",
                        idx === activeImageIndex ? "border-blue-600" : "border-transparent"
                      )}
                    >
                      <ImageWithFallback src={img} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle View: Description / Supplier */}
              <div className="border-t border-gray-100 bg-white">
                {/* Toggle Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setInfoView('description')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2",
                      infoView === 'description'
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Info className="h-4 w-4" /> Description
                  </button>
                  <button
                    onClick={() => setInfoView('supplier')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2",
                      infoView === 'supplier'
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Building className="h-4 w-4" /> Supplier
                  </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                  {infoView === 'description' ? (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 space-y-4"
                    >
                      {/* Product Description */}
                      <div>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {product.description || 'No detailed description available for this product.'}
                        </p>
                      </div>

                      {/* Fabric Details */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900">
                          <Shirt className="h-4 w-4 text-blue-500" /> Fabric Details
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium text-gray-900">{(product as EnhancedStockItem).fabricType || 'N/A'}</span>
                          </div>
                          <div className="text-gray-600 mt-1 text-xs leading-relaxed">
                            {(product as EnhancedStockItem).fabricDescription || 'No additional fabric info.'}
                          </div>
                        </div>
                      </div>

                      {/* Logistics */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900">
                          <Truck className="h-4 w-4 text-blue-500" /> Logistics
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Delivery Time</span>
                            <span className="font-medium text-gray-900">{(product as EnhancedStockItem).deliveryTime || 'Standard'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">MOQ</span>
                            <span className="font-medium text-gray-900">{minOrderQty} Units</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="supplier"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Company Name */}
                        <div>
                          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide block mb-1">Company</span>
                          <span className="font-bold text-gray-900 text-base">{getSafeString(product.supplier) || 'N/A'}</span>
                        </div>

                        {/* Location */}
                        {(product as EnhancedStockItem).location && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide block mb-1">Location</span>
                            <span className="font-medium text-gray-900 flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              {getSafeString((product as EnhancedStockItem).location)}
                            </span>
                          </div>
                        )}

                        {/* Rating */}
                        <div>
                          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide block mb-1">Rating</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= ((product as EnhancedStockItem).supplierRating || 4.5)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="font-bold text-gray-900">
                              {((product as EnhancedStockItem).supplierRating || 4.5).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(product as EnhancedStockItem).supplierReviews || 128} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Contact */}
                        {(product as EnhancedStockItem).supplierContact && (
                          <div className="pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide block mb-1">Contact</span>
                            <span className="text-gray-900 font-medium">{(product as EnhancedStockItem).supplierContact}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </Card>
          </div>

          {/* --- RIGHT COLUMN: DETAILS --- */}
          <div className="lg:col-span-7 space-y-6">

            {/* Header Card */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">
                        {product.category || 'Apparel'}
                      </Badge>
                      <Badge variant="outline" className="text-gray-500 border-gray-200 font-mono">
                        HSN: {(product as EnhancedStockItem).hsnCode || 'N/A'}
                      </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-700">₹{displayPrice.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Per Unit</div>
                  </div>
                </div>

                {/* Optional VTON Button */}
                {product.vtonImageUrl && (
                  <div className="mb-4">
                    <Button 
                      onClick={() => setShowVton(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-none group"
                    >
                      <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      Virtual Try-On 
                    </Button>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">SKU / Barcode</span>
                    <div className="font-medium text-gray-900 flex items-center gap-1 mt-1 text-sm">
                      <Barcode className="h-3 w-3 text-gray-400" />
                      {(product as any).sku || 'GEN-' + product.id.substring(0, 6).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Unit</span>
                    <div className="font-medium text-gray-900 mt-1 text-sm">
                      {(() => {
                        const isSetMode = (product as any).itemSetType === 'set_of_pattern'
                          || (product as any).bulkSellingMode === 'bulksets'
                          || (product as any).unitOfMeasure === 'SET'
                          || (product as any).unitMode === 'bulk';
                        return isSetMode ? 'Sets' : 'Pieces';
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">MOQ</span>
                    <div className="font-bold text-blue-700 mt-1 text-sm">
                      {(() => {
                        const isSetMode = (product as any).itemSetType === 'set_of_pattern'
                          || (product as any).bulkSellingMode === 'bulksets'
                          || (product as any).unitOfMeasure === 'SET'
                          || (product as any).unitMode === 'bulk';
                        return `${minOrderQty} ${isSetMode ? (minOrderQty === 1 ? 'Set' : 'Sets') : (minOrderQty === 1 ? 'Unit' : 'Units')}`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Stock</span>
                    <div className={cn("font-bold mt-1 text-sm", totalStock <= minOrderQty ? "text-red-600" : "text-gray-900")}>
                      {totalStock} Units
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VARIATION SELECTION SECTION */}
            {isEnhancedStock(product) && (() => {
              // Calculate stats
              const uniqueColors = new Set(product.colors?.map(c => c.id) || []);
              const uniqueSizes = new Set(product.sizes?.map(s => s.id) || []);

              // Check if set mode
              const isSetMode = (product as any).itemSetType === 'set_of_pattern'
                || (product as any).bulkSellingMode === 'bulksets'
                || (product as any).unitOfMeasure === 'SET'
                || (product as any).unitMode === 'bulk';

              // Calculate available sets if in set mode
              let totalSets = 0;
              if (isSetMode && product.colors?.length > 0) {
                // For each color, find the minimum quantity across all sizes
                product.colors.forEach(color => {
                  const minForColor = product.sizes.reduce((min, size) => {
                    const combo = product.combinations.find(c => c.colorId === color.id && c.sizeId === size.id);
                    return Math.min(min, combo?.availableQuantity || 0);
                  }, Infinity);
                  totalSets += minForColor === Infinity ? 0 : minForColor;
                });
              }

              // Calculate price range
              const prices = product.combinations
                .map(c => c.price || basePrice)
                .filter(p => p > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : basePrice;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : basePrice;

              return (
                <Card className="border border-green-200 shadow-sm bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-white px-4 py-3 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold flex-shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            Available Variants
                            {isSetMode && (
                              <Badge className="bg-blue-600 text-white text-[10px] h-5 px-2">
                                Sold as Sets
                              </Badge>
                            )}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {product.combinations.length} variants • {uniqueColors.size} colors × {uniqueSizes.size} sizes
                          </p>
                          {isSetMode && totalSets > 0 && (
                            <p className="text-xs text-green-700 font-medium mt-0.5">
                              {totalSets} {totalSets === 1 ? 'set' : 'sets'} available
                            </p>
                          )}
                          {minPrice > 0 && (
                            <p className="text-xs text-blue-700 font-medium mt-0.5">
                              ₹{minPrice}{maxPrice > minPrice ? ` - ₹${maxPrice}` : ''} /pc
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {totalSelectedQty > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                            onClick={handleClearAll}
                          >
                            Clear
                          </Button>
                        )}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                          <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                            Qty:
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full border-gray-300"
                            disabled={bulkSelectQty <= 0}
                            onClick={() => setBulkSelectQty(Math.max(0, bulkSelectQty - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-mono font-bold text-sm text-gray-900 min-w-[2ch] text-center">{bulkSelectQty}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full border-gray-300 hover:border-green-400 hover:text-green-700 hover:bg-green-50"
                            disabled={bulkSelectQty >= 100}
                            onClick={() => setBulkSelectQty(Math.min(100, bulkSelectQty + 1))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Variants Preview List - Compact */}
                    <div className="space-y-2">
                      {product.combinations.map((combo, index) => {
                        const color = product.colors.find(c => c.id === combo.colorId);
                        const size = product.sizes.find(s => s.id === combo.sizeId);
                        const key = `${combo.colorId}|${combo.sizeId}`;
                        const currentQty = selections[key] || 0;
                        const isSelected = currentQty > 0;

                        // Collect all unique images for this color
                        const allImages = [
                          ...(color?.images || []),
                          ...(color?.patternImage ? [color.patternImage] : [])
                        ].filter((url, i, arr) => url && arr.indexOf(url) === i);

                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 shadow-sm transition-all cursor-pointer",
                              isSelected
                                ? "bg-green-50 border-green-400 shadow-md"
                                : "bg-white border-gray-200 hover:border-green-300 hover:shadow",
                              combo.availableQuantity === 0 && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (combo.availableQuantity > 0) {
                                handleQuantityChange(combo.colorId, combo.sizeId, isSelected ? -currentQty : 1, combo.availableQuantity);
                              }
                            }}
                          >
                            {/* Image/Color Swatch */}
                            <div className="flex-shrink-0">
                              {allImages.length > 0 ? (
                                <div className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm">
                                  <ImageWithFallback
                                    src={allImages[0]}
                                    alt={`${color?.name} - ${size?.name}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-16 h-16 rounded-md border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: color?.colorCode || '#eee' }}
                                />
                              )}
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-slate-800">{size?.name || 'Size'}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600 font-medium truncate">{color?.name || 'Color'}</span>
                                {allImages.length > 1 && (
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white ml-auto">
                                    {allImages.length} pics
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                  "font-semibold",
                                  combo.availableQuantity === 0 ? "text-red-500" : "text-gray-700"
                                )}>
                                  {combo.availableQuantity > 0 ? `${combo.availableQuantity} available` : 'Out of stock'}
                                </span>
                                {combo.price && combo.price !== basePrice && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-blue-700 font-medium">₹{combo.price}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Selection Controls */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                                <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                                  Qty:
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full border-gray-300"
                                  disabled={currentQty === 0 || combo.availableQuantity === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(combo.colorId, combo.sizeId, -1, combo.availableQuantity);
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className={cn(
                                  "font-mono font-bold text-sm min-w-[2ch] text-center",
                                  currentQty > 0 ? "text-green-700" : "text-gray-400"
                                )}>{currentQty}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6 rounded-full border-gray-300",
                                    currentQty > 0 && "hover:border-green-400 hover:text-green-700 hover:bg-green-50"
                                  )}
                                  disabled={currentQty >= combo.availableQuantity || combo.availableQuantity === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(combo.colorId, combo.sizeId, 1, combo.availableQuantity);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* PURCHASE ACTIONS - Inline Version */}
            {isEnhancedStock(product) && (
              <Card className="border border-blue-200 shadow-md bg-gradient-to-r from-blue-50 to-white sticky top-20 z-30">
                <CardContent className="p-4">
                  {(() => {
                    // Check if product is sold in sets
                    const isSetMode = (product as any).itemSetType === 'set_of_pattern'
                      || (product as any).bulkSellingMode === 'bulksets'
                      || (product as any).unitOfMeasure === 'SET'
                      || (product as any).unitMode === 'bulk';

                    // Calculate actual quantity for MOQ check
                    let effectiveQty = totalSelectedQty;
                    let displayUnit = 'units';

                    if (isSetMode && isEnhancedStock(product)) {
                      // In set mode, calculate number of complete sets
                      const sizesCount = product.sizes?.length || 1;
                      effectiveQty = Math.floor(totalSelectedQty / sizesCount);
                      displayUnit = effectiveQty === 1 ? 'set' : 'sets';
                    }

                    const meetsMinOrderQty = effectiveQty >= minOrderQty;

                    // Debug logging
                    console.log('🔍 MOQ Debug:', {
                      itemSetType: (product as any).itemSetType,
                      bulkSellingMode: (product as any).bulkSellingMode,
                      unitOfMeasure: (product as any).unitOfMeasure,
                      unitMode: (product as any).unitMode,
                      isSetMode,
                      totalSelectedQty,
                      sizesCount: isEnhancedStock(product) ? product.sizes?.length : 'N/A',
                      effectiveQty,
                      minOrderQty,
                      meetsMinOrderQty
                    });

                    return (
                      <div className={cn(
                        "flex items-center justify-between gap-4 transition-opacity",
                        !meetsMinOrderQty && "opacity-50"
                      )}>
                        <div className="flex-1">
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Amount</div>
                          <div className="text-xl font-bold text-blue-700">
                            ₹{totalSelectedPrice.toLocaleString()}
                            <span className="text-xs font-normal text-gray-400 ml-1">
                              for {isSetMode ? `${effectiveQty} ${displayUnit} (${totalSelectedQty} pcs)` : `${totalSelectedQty} units`}
                            </span>
                          </div>
                          {effectiveQty > 0 && !meetsMinOrderQty && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>MOQ: {minOrderQty} {isSetMode ? (minOrderQty === 1 ? 'set' : 'sets') : 'units'} required</span>
                            </div>
                          )}
                          {effectiveQty === 0 && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Info className="h-3 w-3" />
                              <span>Select variants above to add to cart</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 flex-shrink-0">
                          <Button
                            variant="outline"
                            className="hidden sm:flex border-blue-200 text-blue-700 hover:bg-blue-50"
                            disabled={!meetsMinOrderQty}
                            onClick={() => setShowPurchaseDialog(true)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Purchase Request
                          </Button>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!meetsMinOrderQty}
                            onClick={() => {
                              if (onAddToCart) {
                                // Construct cart items from selections
                                const items = Object.entries(selections).map(([key, qty]) => {
                                  const [colorId, sizeId] = key.split('|');
                                  const color = (product as EnhancedStockItem).colors.find(c => c.id === colorId);
                                  const size = (product as EnhancedStockItem).sizes.find(s => s.id === sizeId);
                                  return {
                                    ...product,
                                    selectedColor: color,
                                    selectedSize: size,
                                    quantity: qty,
                                    variationId: key
                                  };
                                });
                                onAddToCart(items);
                                toast.success(`Added ${totalSelectedQty} items to cart`);
                              }
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Request Summary</DialogTitle>
            <DialogDescription>Review your order details before sending the request</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Header */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {mainImage && (
                <div className="w-20 h-20 rounded-md border border-gray-200 overflow-hidden bg-white flex-shrink-0">
                  <ImageWithFallback
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category || 'Apparel'}</p>
                <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier || 'N/A'}</p>
              </div>
            </div>

            {/* Selected Variants */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Selected Variants</Label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {Object.entries(selections).map(([key, qty]) => {
                  const [colorId, sizeId] = key.split('|');
                  const color = isEnhancedStock(product)
                    ? product.colors.find(c => c.id === colorId)
                    : null;
                  const size = isEnhancedStock(product)
                    ? product.sizes.find(s => s.id === sizeId)
                    : null;
                  const combo = isEnhancedStock(product)
                    ? product.combinations.find(c => c.colorId === colorId && c.sizeId === sizeId)
                    : null;
                  const pricePerUnit = combo?.price || basePrice;
                  const lineTotal = qty * pricePerUnit;

                  return (
                    <div key={key} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {color?.colorCode && (
                          <div
                            className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: color.colorCode }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {size?.name || 'Size'} • {color?.name || 'Color'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {qty} × ₹{pricePerUnit.toLocaleString()} = ₹{lineTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{qty} units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity</span>
                <span className="font-semibold text-gray-900">{totalSelectedQty} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Price per Unit</span>
                <span className="font-semibold text-gray-900">₹{basePrice.toLocaleString()}</span>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-700">₹{totalSelectedPrice.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Final pricing and terms will be confirmed by the seller
              </p>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special requirements, delivery preferences, or questions..."
                value={purchaseNote}
                onChange={(e) => setPurchaseNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.error('Please login to send purchase request');
                  return;
                }

                if (totalSelectedQty === 0) {
                  toast.error('Please select at least one item');
                  return;
                }

                // Prepare request data for checkout
                const items = Object.entries(selections).map(([key, qty]) => {
                  const [colorId, sizeId] = key.split('|');
                  const combo = isEnhancedStock(product)
                    ? product.combinations.find(c => c.colorId === colorId && c.sizeId === sizeId)
                    : null;
                  const pricePerUnit = combo?.price || basePrice;

                  return {
                    combinationId: key,
                    colorId,
                    sizeId,
                    quantity: qty,
                    pricePerUnit,
                    totalPrice: qty * pricePerUnit
                  };
                });

                const requestData = {
                  stockId: product.id,
                  stockName: product.name,

                  // Seller info
                  sellerId: (product as any).sellerId || (product as any).supplierId || 'unknown',
                  sellerName: product.supplier || 'Unknown Supplier',
                  sellerCompany: product.supplier || 'Unknown Company',

                  // Buyer info
                  buyerId: user.id,
                  buyerName: user.profile?.displayName || user.email || 'Unknown Buyer',
                  buyerCompany: user.profile?.company || user.email || '',

                  // Order details
                  items,
                  totalQuantity: totalSelectedQty,
                  totalAmount: totalSelectedPrice,

                  // Additional info
                  specialInstructions: purchaseNote,
                  status: 'pending_seller_ack' as const,

                  // Temporary fields for display (will be replaced when created)
                  id: 'temp_' + Date.now(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                setCreatedRequest(requestData as any);

                // Close current dialog and open checkout dialog immediately
                setShowPurchaseDialog(false);
                setCheckoutPhase('checkout');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-step Checkout */}
      <Dialog open={checkoutPhase === 'checkout'} onOpenChange={() => setCheckoutPhase('summary')}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Purchase Request</DialogTitle>
            <DialogDescription>Enter logistics and payment details to finalize your request</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Header */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {mainImage && (
                <div className="w-20 h-20 rounded-md border border-gray-200 overflow-hidden bg-white flex-shrink-0">
                  <ImageWithFallback
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category || 'Apparel'}</p>
                <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier || 'N/A'}</p>
              </div>
            </div>

            {/* Selected Variants */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Selected Variants</Label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {Object.entries(selections).map(([key, qty]) => {
                  const [colorId, sizeId] = key.split('|');
                  const color = isEnhancedStock(product)
                    ? product.colors.find(c => c.id === colorId)
                    : null;
                  const size = isEnhancedStock(product)
                    ? product.sizes.find(s => s.id === sizeId)
                    : null;
                  const combo = isEnhancedStock(product)
                    ? product.combinations.find(c => c.colorId === colorId && c.sizeId === sizeId)
                    : null;
                  const pricePerUnit = combo?.price || basePrice;
                  const lineTotal = qty * pricePerUnit;

                  return (
                    <div key={key} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {color?.colorCode && (
                          <div
                            className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: color.colorCode }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {size?.name || 'Size'} • {color?.name || 'Color'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {qty} × ₹{pricePerUnit.toLocaleString()} = ₹{lineTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{qty} units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity</span>
                <span className="font-semibold text-gray-900">{totalSelectedQty} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Price per Unit</span>
                <span className="font-semibold text-gray-900">₹{basePrice.toLocaleString()}</span>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-700">₹{totalSelectedPrice.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Final pricing and terms will be confirmed by the seller
              </p>
            </div>

            {/* Checkout Form */}
            {createdRequest && (
              <MultiStepCheckout
                request={createdRequest}
                onComplete={handleCheckoutComplete}
                onCancel={() => setCheckoutPhase('summary')}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutPhase('summary')}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Debug Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <details className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <summary className="cursor-pointer font-bold text-gray-700">Debug: Image Data</summary>
          <div className="mt-4 space-y-4 text-xs font-mono overflow-auto">

            {/* Images Array */}
            <div>
              <h4 className="font-bold text-blue-600">Calculated Images Array ({images.length})</h4>
              <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                {images.map((img, i) => (
                  <div key={i} className="mb-1 pb-1 border-b border-gray-100 last:border-0 truncate">
                    <span className="font-bold mr-2">[{i}]:</span>
                    <a href={img} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{img}</a>
                  </div>
                ))}
                {images.length === 0 && <span className="text-gray-400">No images found</span>}
              </div>
            </div>

            {/* Main Images */}
            {isEnhancedStock(product) && (
              <div>
                <h4 className="font-bold text-blue-600">Main Images (Basic Info)</h4>
                <pre className="bg-white p-2 rounded border border-gray-200 mt-1 overflow-x-auto">
                  {JSON.stringify(product.mainImages, null, 2)}
                </pre>
              </div>
            )}

            {/* Colors & their images */}
            {isEnhancedStock(product) && (
              <div>
                <h4 className="font-bold text-purple-600">Color Variant Images</h4>
                <div className="bg-white p-2 rounded border border-gray-200 mt-1 space-y-2">
                  {product.colors?.map((c, i) => (
                    <div key={i} className="border-b border-gray-100 pb-2 last:border-0">
                      <div className="font-bold">{c.name} ({c.id})</div>
                      <div className="pl-4">
                        <div>Pattern: {c.patternImage ? '✅ Present' : '❌ None'}</div>
                        <div>Images: {c.images?.length || 0}</div>
                        {c.images?.map((img, j) => (
                          <div key={j} className="pl-2 truncate text-gray-500">{j}: {img}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Combinations & their images */}
            {isEnhancedStock(product) && (
              <div>
                <h4 className="font-bold text-green-600">Combination Images</h4>
                <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                  <div className="grid grid-cols-1 gap-2">
                    {product.combinations?.filter(c => c.images?.length > 0).map((c, i) => (
                      <div key={i} className="truncate">
                        <span className="font-bold">{c.colorId}|{c.sizeId}:</span> {c.images.length} images
                      </div>
                    ))}
                    {product.combinations?.filter(c => c.images?.length > 0).length === 0 && (
                      <span className="text-gray-400">No combination-specific images</span>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </details>
      </div>
    </div>
  );
}
