import React from 'react';
import { CartItem } from './CartTypes';
import { Badge } from '../ui/badge';
import { Minus, Plus, Package } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { resolveImageUrl, isValidImageSource } from '../../utils/imageUtils';

// Local helper as a fallback to prevent "is not a function" errors
// this ensures the component is robust even if utility imports have issues
const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove
}) => {
  const isImageLike = isValidImageSource;

  const getImageUrl = (obj: any): string => {
    if (!obj) return '';
    // Check common array fields
    const arrayFields = ['images', 'mainImages', 'productImages', 'gallery', 'photos'];
    for (const field of arrayFields) {
      if (Array.isArray(obj[field]) && obj[field].length > 0) {
        if (typeof obj[field][0] === 'string') return resolveImageUrl(obj[field][0]);
        if (typeof obj[field][0] === 'object' && obj[field][0]?.url) return resolveImageUrl(obj[field][0].url);
      }
    }
    // Check common string fields
    const stringFields = ['image', 'mainImage', 'productImage', 'thumbnail', 'pic', 'url', 'imageUrl', 'imgUrl'];
    for (const field of stringFields) {
      if (typeof obj[field] === 'string' && isValidImageSource(obj[field])) return resolveImageUrl(obj[field]);
    }
    // Check color field as fallback image
    if (isValidImageSource(obj.color)) return resolveImageUrl(obj.color);
    return '';
  };

  const imageUrl = getImageUrl(item.stockItem);
  const displayColor = isImageLike(item.stockItem.color) ? 'Default' : item.stockItem.color;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="mb-4 bg-white border border-zinc-200 transition-all duration-300 hover:border-zinc-400 hover:shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr_180px] gap-0 bg-white min-h-[140px] md:min-h-[160px]">

        {/* Bento Box 1: Image Grid - Enforce minimum width to prevent collapse */}
        <div className="border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-100 overflow-hidden group aspect-[1/1] md:aspect-auto md:w-[140px] lg:w-[160px] relative shrink-0">
          <div className="w-full h-full flex flex-col absolute inset-0 md:relative">
            {item.stockItem.images && item.stockItem.images.length > 1 ? (
              <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[0.5px] bg-zinc-200 flex-1">
                {item.stockItem.images.slice(0, 4).map((img: string, i: number) => (
                  <div key={i} className="relative bg-white overflow-hidden h-full w-full">
                    <ImageWithFallback
                      src={img}
                      alt={`${getSafeString(item.stockItem.name)} ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full relative flex-1 min-h-[140px] md:min-h-[160px] flex items-center justify-center bg-zinc-50">
                {imageUrl ? (
                  <ImageWithFallback
                    src={imageUrl}
                    alt={getSafeString(item.stockItem.name)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-300">
                    <Package className="h-8 w-8 opacity-20" strokeWidth={1} />
                    <span className="text-[7px] uppercase tracking-[0.2em] font-bold opacity-40">No Preview</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bento Box 2: Product Info */}
        <div className="p-4 lg:p-5 flex flex-col justify-between border-b md:border-b-0 lg:border-r border-zinc-200">
          <div className="flex flex-col h-full justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg md:text-xl text-zinc-900 tracking-tight leading-snug mb-5 truncate">
                {getSafeString(item.stockItem.name)}
                {item.isItemSet && (
                  <Badge variant="secondary" className="ml-3 bg-zinc-100 text-zinc-900 font-mono text-[9px] uppercase tracking-[0.2em] rounded-none border border-zinc-200">
                    <Package className="w-3 h-3 mr-1.5 inline-block" strokeWidth={1.5} /> Set
                  </Badge>
                )}
              </h3>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-5 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                <div className="flex flex-col border-b border-zinc-100 pb-2 overflow-hidden">
                  <span className="text-[8px] text-zinc-400 mb-1">Supplier</span>
                  <span className="text-zinc-900 truncate pr-2" title={getSafeString(item.stockItem.supplier)}>
                    {getSafeString(item.stockItem.supplier)}
                  </span>
                </div>
                <div className="flex flex-col border-b border-zinc-100 pb-2 overflow-hidden">
                  <span className="text-[8px] text-zinc-400 mb-1">Color</span>
                  <span className="text-zinc-900 truncate pr-2" title={getSafeString(displayColor || (item.stockItem as any).selectedColor?.name || 'Default')}>
                    {getSafeString(displayColor || (item.stockItem as any).selectedColor?.name || 'Default')}
                  </span>
                </div>
                {!item.isItemSet ? (
                  <div className="flex flex-col border-b border-zinc-100 pb-2 overflow-hidden">
                    <span className="text-[8px] text-zinc-400 mb-1">Size</span>
                    <span className="text-zinc-900 truncate pr-2" title={getSafeString(item.stockItem.sizeDetails?.displayName || item.stockItem.size || (item.stockItem as any).selectedSize || 'One Size')}>
                      {getSafeString(item.stockItem.sizeDetails?.displayName || item.stockItem.size || (item.stockItem as any).selectedSize || 'One Size')}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col border-b border-zinc-100 pb-2 overflow-hidden">
                    <span className="text-[8px] text-zinc-400 mb-1">Sets</span>
                    <span className="text-zinc-900 truncate pr-2">{item.numberOfSets}</span>
                  </div>
                )}
                {item.stockItem.location && (
                  <div className="flex flex-col border-b border-zinc-100 pb-2 overflow-hidden">
                    <span className="text-[8px] text-zinc-400 mb-1">Location</span>
                    <span className="text-zinc-900 truncate pr-2" title={getSafeString(item.stockItem.location)}>
                      {getSafeString(item.stockItem.location)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center mt-auto pt-6">
              <button
                onClick={() => onRemove(item.id)}
                className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-red-500 transition-all border border-zinc-200 hover:border-red-200 px-3 py-1.5 bg-white hover:bg-red-50"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>

        {/* Bento Box 3: Pricing & Actions */}
        <div className="p-4 lg:p-5 flex flex-row lg:flex-col justify-between items-center lg:items-end bg-zinc-50/50 md:col-span-2 lg:col-span-1 border-t md:border-t-0 border-zinc-200 h-full">
          <div className="text-left lg:text-right w-full mb-0 lg:mb-4">
            <p className="font-serif text-xl lg:text-2xl text-zinc-900 leading-none mb-2 mt-1 break-words">
              {formatCurrency(item.totalPrice)}
            </p>
            <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 break-words">
              {formatCurrency(item.unitPrice)} {item.isItemSet ? '/ SET' : '/ PC'}
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end w-full mt-auto">
            <div className="flex items-center bg-white border border-zinc-200 shrink-0 shadow-sm">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="h-9 w-9 flex shrink-0 items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-50 transition-colors disabled:opacity-30"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>

              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 0;
                  handleQuantityChange(newQuantity);
                }}
                className="w-10 h-9 bg-transparent text-center text-xs font-bold border-x border-zinc-200 focus:outline-none focus:bg-white"
                min="1"
              />

              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="h-9 w-9 flex shrink-0 items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
