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
    if (typeof (stock as any).image === 'string') return [(stock as any).image];
    if (typeof (stock as any).imageUrl === 'string') return [(stock as any).imageUrl];
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

  const isOwner = user?.company === stock.supplier;
  const effectivePrice = getEffectivePrice(stock, user?.role, user?.businessType, isOwner) ?? stock.basePrice ?? (stock as any).price ?? 0;
  const isOnSale = stock.offerPrice && stock.offerPrice < effectivePrice;

  let totalAvailableQuantity = (stock.combinations || []).reduce(
    (sum, combo) => sum + (combo.availableQuantity || 0), 0
  );
  if (totalAvailableQuantity === 0 && (stock as any).quantity !== undefined) {
    totalAvailableQuantity = (stock as any).quantity;
  }

  const isOutOfStock = totalAvailableQuantity === 0;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(stock)}
      className={`group relative flex flex-col w-full h-[480px] bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden ${isOutOfStock ? 'opacity-70 grayscale-[0.2]' : ''}`}
    >
      {/* Image Area - Premium Soft Corners */}
      <div
        className="relative w-full h-[65%] bg-slate-50 overflow-hidden"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayImageIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {currentImage && resolveImageUrl(currentImage) ? (
              <img
                src={resolveImageUrl(currentImage)}
                alt={stock.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/f8fafc/94a3b8?text=NO+IMAGE';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs tracking-widest text-slate-400 uppercase bg-slate-50">
                <div className="w-10 h-10 mb-3 text-slate-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                No Image
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Elegant Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Minimal Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {isOutOfStock && (
            <span className="text-[10px] font-bold tracking-[0.2em] text-white bg-red-500/90 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
              SOLD OUT
            </span>
          )}
          {isOnSale && !isOutOfStock && (
            <span className="text-[10px] font-bold tracking-[0.2em] text-white bg-indigo-600/90 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
              SALE
            </span>
          )}
        </div>

        {/* Preferred Heart Icon Toggle */}
        {user?.role === 'retailer' && onTogglePreferred && (
          <button
            onClick={(e) => handleAction(e, onTogglePreferred)}
            className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition-all transform hover:scale-110 active:scale-95"
          >
            <Heart className={`w-4 h-4 transition-colors duration-300 ${isPreferredSupplier ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>
        )}
      </div>

      {/* Info Area - Clean Typography */}
      <div className="relative flex-1 p-5 flex flex-col justify-between bg-white z-20">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {stock.name || 'Untitled Product'}
            </h3>
            <span className="text-base font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg">
              ₹{effectivePrice.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center mt-3 gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{getSafeString(stock.category) || 'Uncategorized'}</span>
            {stock.fabricType && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{stock.fabricType}</span>
            )}
            <span className="ml-auto flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
               {totalAvailableQuantity} Left
            </span>
          </div>

          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">{getSafeString(stock.supplier) || 'Unknown Supplier'}</span>
            {stock.location && <><span className="mx-1">•</span><span className="truncate">{stock.location}</span></>}
          </div>
        </div>

        {/* Actions Drop-in Reveal */}
        <div className={`mt-4 w-full transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {showOwnerActions && isOwner ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => handleAction(e, () => onEdit?.(stock))}
                className="h-9 rounded-xl border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-all"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => handleAction(e, () => onDelete?.(stock.id))}
                className="h-9 rounded-xl border-slate-200 hover:border-red-600 hover:bg-red-50 hover:text-red-600 font-semibold transition-all"
              >
                Delete
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={(e: React.MouseEvent) => handleAction(e, () => onViewDetails?.(stock))}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold tracking-wide shadow-md hover:shadow-xl transition-all duration-300"
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
