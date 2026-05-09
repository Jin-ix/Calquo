// Enhanced types for the new stock management system
import { getDisplayImages } from '../../utils/imageUtils';

export interface PatternDefinition {
  hasColorPicker: boolean;
  hasImage: boolean;
  hasName: boolean;
}

export interface ColorVariant {
  id: string;
  name?: string; // Optional pattern/color name
  colorCode?: string; // Hex color code from color picker
  patternImage?: string; // Main pattern/color image
  images: string[]; // Additional images specific to this color
  definition: PatternDefinition; // Tracks which definition methods were used
}

export interface SizeVariant {
  id: string;
  name: string;
  displayName: string;
}

// New type for size-first approach
export interface SizeWithColors {
  id: string;
  size: SizeVariant;
  colors: ColorVariant[];
}

export interface StockCombination {
  id: string;
  colorId?: string; // Optional for Individual Flex
  sizeId?: string; // Optional for Individual Flex
  quantity: number;
  availableQuantity: number;
  images: string[]; // Images specific to this combination
}

export type ItemSetType = 'set_of_pattern' | 'single_color' | 'individual_flex';

export interface EnhancedStockItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  sellerId?: string; // ID of the seller user
  supplier: string;
  supplierType: 'manufacturer' | 'trader' | 'warehouse' | 'financial';
  location: string;
  dateAdded: string;

  // Enhanced configuration
  itemSetType: ItemSetType;
  colors: ColorVariant[];
  sizes: SizeVariant[];
  combinations: StockCombination[];
  flexibleSelectionAllowed: boolean;
  mainImages?: string[]; // Main product images from Basic Information section

  // Pricing
  basePrice: number;
  singleShopPrice?: number;
  multiShopPrice?: number;
  minOrderQuantity: number;

  // Additional properties
  fabricType?: string;
  fabricDescription?: string;
  vtonImageUrl?: string; // Virtual Try-On base subject image
  deliveryTime?: '5-10 days' | '10-20 days' | 'more than 1 month';
  tradersOnly?: boolean;
  hsnCode?: string;

  // Offer properties
  offerPrice?: number;
  offerType?: 'time' | 'quantity';
  offerTimeWeeks?: number;
  offerMinQuantity?: number;
  offerValidUntil?: string;
  offerCreatedDate?: string;

  // Status
  status?: 'active' | 'inactive' | 'draft';
}

export interface EnhancedOrderRequest {
  id: string;
  stockId: string;
  stockName: string;
  itemSetType: ItemSetType;

  // Selected options
  selectedCombinations: Array<{
    combinationId: string;
    colorId?: string;
    sizeId?: string;
    quantity: number;
    pricePerUnit: number;
  }>;

  totalQuantity: number;
  totalAmount: number;

  // Buyer information
  buyerCompany: string;
  buyerEmail?: string;
  buyerPhone?: string;

  // Supplier information
  supplierName: string;
  supplierLocation?: string;

  // Order details
  status: 'request_sent' | 'accepted' | 'rejected' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  paymentMethod?: 'upi' | 'bank_transfer' | 'pending';
  paymentStatus: 'pending' | 'payment_required' | 'completed' | 'failed' | 'agent_pending';

  // Additional details
  deliveryAddress?: string;
  specialInstructions?: string;
  adminRemarks?: string;
  adminUpdatedDate?: string;
  acceptanceDate?: string;
  needsPaymentConfirmation?: boolean;
}

// Helper functions for working with enhanced stock items
export const getAvailableColors = (stock: EnhancedStockItem): ColorVariant[] => {
  // Safety check for undefined/null stock or colors
  if (!stock || !stock.colors || !Array.isArray(stock.colors)) {
    return [];
  }

  if (stock.itemSetType === 'single_color') {
    return stock.colors.slice(0, 1); // Only one color for single color sets
  }
  return stock.colors;
};

export const getAvailableSizes = (stock: EnhancedStockItem): SizeVariant[] => {
  // Safety check for undefined/null stock or sizes
  if (!stock || !stock.sizes || !Array.isArray(stock.sizes)) {
    return [];
  }

  if (stock.itemSetType === 'single_color') {
    return stock.sizes; // All sizes for single color sets
  }
  return stock.sizes;
};

export const getCombinationQuantity = (
  stock: EnhancedStockItem,
  colorId?: string,
  sizeId?: string
): number => {
  // Safety check for undefined/null stock or combinations
  if (!stock || !stock.combinations || !Array.isArray(stock.combinations)) {
    return 0;
  }

  const combination = stock.combinations.find(c =>
    c.colorId === colorId && c.sizeId === sizeId
  );
  return combination?.availableQuantity || 0;
};

export const getCombinationImages = (
  stock: EnhancedStockItem,
  colorId?: string,
  sizeId?: string
): string[] => {
  // Use the improved image prioritization from imageUtils
  return getDisplayImages(stock, colorId, sizeId);
};

export const getEffectivePrice = (
  stock: EnhancedStockItem,
  userRole?: string,
  businessType?: string
): number | undefined => {
  // Return undefined if no prices are available
  if (!stock) return undefined;

  // Check for offer price first
  if (stock.offerPrice && stock.offerPrice > 0) {
    // Validate offer is still active
    if (stock.offerValidUntil) {
      const now = new Date();
      const offerExpiry = new Date(stock.offerValidUntil);
      if (now <= offerExpiry) {
        return stock.offerPrice;
      }
    } else if (stock.offerType === 'quantity') {
      // Quantity-based offers are always active until manually disabled
      return stock.offerPrice;
    }
  }

  // Wholesaler pricing logic (manufacturers, traders viewing as buyers, or specific roles)
  if ((userRole === 'wholesaler' || userRole === 'trader' || userRole === 'manufacturer') && stock.dealerPrice && stock.dealerPrice > 0) {
    return stock.dealerPrice;
  }

  // Retailer pricing logic
  if (userRole === 'retailer') {
    if (stock.retailerPrice && stock.retailerPrice > 0) {
      return stock.retailerPrice;
    }
    // Backward compatibility for single/multi shop
    if (businessType === 'single_shop' && stock.singleShopPrice && stock.singleShopPrice > 0) {
      return stock.singleShopPrice;
    }
    if (businessType === 'multi_shop' && stock.multiShopPrice && stock.multiShopPrice > 0) {
      return stock.multiShopPrice;
    }
  }

  // Fallback to base price
  return stock.basePrice && stock.basePrice > 0 ? stock.basePrice : undefined;
};

// Get the best available image from any part of the stock item
export const getBestAvailableImage = (stock: EnhancedStockItem): string => {
  if (!stock) return '';

  // Priority 1: Main images
  if (stock.mainImages && stock.mainImages.length > 0 && stock.mainImages[0]) {
    return stock.mainImages[0];
  }

  // Priority 2: First color's images
  if (stock.colors && stock.colors.length > 0) {
    const firstColor = stock.colors[0];
    if (firstColor.images && firstColor.images.length > 0 && firstColor.images[0]) {
      return firstColor.images[0];
    }
    // Priority 3: Pattern image
    if (firstColor.patternImage) {
      return firstColor.patternImage;
    }
  }

  // Priority 4: Combination images
  if (stock.combinations && stock.combinations.length > 0) {
    for (const combo of stock.combinations) {
      if (combo.images && combo.images.length > 0 && combo.images[0]) {
        return combo.images[0];
      }
    }
  }

  // No image available
  return '';
};

// Get all available color images for display
export const getColorImagesForDisplay = (stock: EnhancedStockItem): Array<{
  colorId: string;
  colorName?: string;
  colorCode?: string;
  image?: string;
  patternImage?: string;
}> => {
  if (!stock || !stock.colors || !Array.isArray(stock.colors)) {
    return [];
  }

  return stock.colors.map(color => ({
    colorId: color.id,
    colorName: color.name,
    colorCode: color.colorCode,
    image: color.images && color.images.length > 0 ? color.images[0] : undefined,
    patternImage: color.patternImage
  }));
};
