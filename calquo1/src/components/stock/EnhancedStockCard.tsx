import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthProvider';
import {
  EnhancedStockItem,
  getEffectivePrice
} from './EnhancedStockTypes';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../../utils/imageUtils';

interface EnhancedStockCardProps {
  stock: EnhancedStockItem;
  onOrderSubmit: (order: any) => void;
  isPreferredSupplier?: boolean;
  onTogglePreferred?: () => void;
  showOwnerActions?: boolean;
  onEdit?: (stock: EnhancedStockItem) => void;
  onDelete?: (stockId: string) => void;
  onProceedToPurchase?: (stock: EnhancedStockItem, selectedCombinations: any[], specialInstructions: string) => void;
  onViewDetails?: (stock: EnhancedStockItem) => void;
}

export function EnhancedStockCard({
  stock,
  isPreferredSupplier = false,
  onTogglePreferred,
  showOwnerActions = false,
  onEdit,
  onDelete,
  onViewDetails
}: EnhancedStockCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const getSafeString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') return value.name || value.id || 'N/A';
    return String(value);
  };

  const getPrimaryImages = (): string[] => {
    if ((stock as any).images && (stock as any).images.length > 0) return (stock as any).images;
    if (stock.mainImages && stock.mainImages.length > 0) return stock.mainImages;
    if ((stock as any).productImages && (stock as any).productImages.length > 0) return (stock as any).productImages;
    if (stock.colors && stock.colors.length > 0 && stock.colors[0].images?.length) return stock.colors[0].images;
    if (stock.combinations) {
      for (const combo of stock.combinations) {
        if (combo.images && combo.images.length > 0) return combo.images;
      }
    }
    return [];
  };

  const primaryImages = getPrimaryImages();
  // On hover, show second image if available
  const displayImageIndex = isImageHovered && primaryImages.length > 1 ? 1 : 0;
  const currentImage = primaryImages[displayImageIndex] || null;

  const effectivePrice = getEffectivePrice(stock, user?.role, user?.businessType) ?? stock.basePrice ?? 0;
  const isOnSale = stock.offerPrice && stock.offerPrice < effectivePrice;

  const totalAvailableQuantity = (stock.combinations || []).reduce(
    (sum, combo) => sum + (combo.availableQuantity || 0), 0
  );

  const isOutOfStock = totalAvailableQuantity === 0;
  const isOwner = user?.company === stock.supplier;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(stock)}
      className={`group relative flex flex-col w-full h-[450px] bg-[#FAF9F6] border border-black/5 hover:border-black/20 transition-all duration-500 cursor-pointer overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}
    >
      {/* Image Area - Sharp Corners, Tall */}
      <div
        className="relative w-full h-[65%] sm:h-[70%] bg-[#F5F5F5] overflow-hidden"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayImageIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {currentImage && resolveImageUrl(currentImage) ? (
              <img
                src={resolveImageUrl(currentImage)}
                alt={stock.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/f5f5f5/cccccc?text=NO+IMAGE';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[10px] tracking-[0.2em] text-black/20 uppercase bg-[#F5F5F5]">
                <div className="w-8 h-8 mb-2 opacity-20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                No Image Array
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Minimal Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock && (
            <span className="text-[10px] font-bold tracking-[0.15em] text-red-600 bg-white/90 px-2 py-1 backdrop-blur-sm shadow-sm border border-red-100">
              SOLD OUT
            </span>
          )}
          {isOnSale && !isOutOfStock && (
            <span className="text-[10px] font-bold tracking-[0.15em] text-white bg-black/90 px-2 py-1 backdrop-blur-sm shadow-sm">
              SALE
            </span>
          )}
        </div>

        {/* Preferred Heart Icon Toggle */}
        {user?.role === 'retailer' && onTogglePreferred && (
          <button
            onClick={(e) => handleAction(e, onTogglePreferred)}
            className="absolute top-3 right-3 z-10 p-2 bg-white/50 hover:bg-white/90 backdrop-blur-md rounded-full transition-colors"
          >
            <Heart className={`w-4 h-4 ${isPreferredSupplier ? 'fill-red-500 text-red-500' : 'text-black/60'}`} />
          </button>
        )}
      </div>

      {/* Info Area - Strict Alignment, Uppercase Typogrpahy */}
      <div className="relative flex-1 p-4 flex flex-col justify-between bg-transparent">
        <div>
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-black line-clamp-1">
              {stock.name}
            </h3>
            <span className="text-sm tracking-widest font-light text-black whitespace-nowrap">
              ₹{effectivePrice.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center mt-2 gap-x-3 gap-y-1 text-[10px] sm:text-xs tracking-widest text-black/50 uppercase">
            <span>{getSafeString(stock.category)}</span>
            {stock.fabricType && (
              <>
                <span className="text-black/20">•</span>
                <span>{stock.fabricType}</span>
              </>
            )}
            <span className="text-black/20">•</span>
            <span>{totalAvailableQuantity} PCS</span>
          </div>

          <div className="mt-1.5 text-[10px] tracking-widest text-black/40 uppercase truncate">
            {getSafeString(stock.supplier)} {stock.location ? `— ${stock.location}` : ''}
          </div>
        </div>

        {/* Actions Drop-in Reveal */}
        <div className={`mt-3 w-full transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          {showOwnerActions && isOwner ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => handleAction(e, () => onEdit?.(stock))}
                className="h-8 rounded-none border-black/20 hover:bg-black hover:text-white uppercase tracking-widest text-[10px]"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => handleAction(e, () => onDelete?.(stock.id))}
                className="h-8 rounded-none border-red-500/20 text-red-600 hover:bg-red-50 hover:border-red-500 uppercase tracking-widest text-[10px]"
              >
                Delete
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e: React.MouseEvent) => handleAction(e, () => onViewDetails?.(stock))}
              className="w-full h-8 rounded-none border-black hover:bg-black hover:text-white uppercase tracking-widest text-[10px]"
            >
              View Details
            </Button>
          )}
        </div>
      </div>

    </motion.div>
  );
}
