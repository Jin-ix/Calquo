import { EnhancedStockItem, ColorVariant, StockCombination } from '../components/stock/EnhancedStockTypes';

/**
 * Validates if a string or source is a likely image reference
 */
export const isValidImageSource = (source: any): boolean => {
  if (typeof source !== 'string' || !source) return false;
  const s = source.toLowerCase().trim();

  // Exclude common placeholder keywords if they are alone
  if (s === 'image' || s === 'placeholder' || s === 'no image' || s === 'none') return false;

  return s.startsWith('http') ||
    s.startsWith('data:image/') ||
    s.includes('firebasestorage') ||
    s.includes('image') ||
    s.includes('jpg') ||
    s.includes('png') ||
    s.includes('images/') ||
    s.includes('assets/') ||
    !!s.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)/i);
};

/**
 * Resolves a raw image source (URL, path, or keyword) into a usable public URL
 */
export const resolveImageUrl = (source: any): string => {
  if (!isValidImageSource(source)) return '';

  const s = (source as string).trim();

  // If it's already a full URL or data URL, return as is
  if (s.startsWith('http') || s.startsWith('data:image/')) return s;

  // If it's a Firebase Storage path (not a full URL but contains segments)
  // We assume it's a path if it contains slashes but doesn't start with one
  if (s.includes('/') && !s.startsWith('/')) {
    return `https://firebasestorage.googleapis.com/v0/b/b2b-platform-821f8.appspot.com/o/${encodeURIComponent(s)}?alt=media`;
  }

  return s;
};

// Helper function to identify demo/placeholder images
export const isDemoImage = (url: string): boolean => {
  if (!url) return true;

  // Check for common demo image patterns
  const demoPatterns = [
    'placeholder',
    'demo',
    'sample',
    'example',
    'default',
    'unsplash.com',
    'picsum.photos',
    'via.placeholder.com',
    'dummyimage.com',
    'source.unsplash.com',
    'images.unsplash.com'
  ];

  const lowerUrl = url.toLowerCase();
  return demoPatterns.some(pattern => lowerUrl.includes(pattern));
};

// Helper function to identify user-uploaded images
export const isUserUploadedImage = (url: string): boolean => {
  if (!url) return false;

  // Check for Firebase storage URLs or other legitimate upload patterns
  const userUploadPatterns = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    '/uploads/',
    'figma:asset/', // Figma imported assets
    '/user-images/',
    'blob:',
    'data:image/' // Base64 images from camera/file upload
  ];

  const lowerUrl = url.toLowerCase();
  return userUploadPatterns.some(pattern => lowerUrl.includes(pattern));
};

// Prioritize user-uploaded images over demo images
export const prioritizeUserImages = (images: string[]): string[] => {
  if (!images || images.length === 0) return [];

  // Separate user-uploaded and demo images
  const userImages = images.filter(isUserUploadedImage);
  const demoImages = images.filter(isDemoImage);
  const otherImages = images.filter(img => !isUserUploadedImage(img) && !isDemoImage(img));

  // Prioritize: User uploads > Other images > Demo images
  return [...userImages, ...otherImages, ...demoImages];
};

// Get the best available image from a list, prioritizing user uploads
export const getBestImage = (images: string[]): string | undefined => {
  const prioritizedImages = prioritizeUserImages(images);
  return prioritizedImages.length > 0 ? prioritizedImages[0] : undefined;
};

// Process stock item to prioritize user-uploaded images
export const processStockItemImages = (stock: EnhancedStockItem): EnhancedStockItem => {
  if (!stock) return stock;
  
  return {
    ...stock,
    // Prioritize main images
    mainImages: stock.mainImages ? prioritizeUserImages(stock.mainImages) : undefined,

    // Process color variants
    colors: (stock.colors || []).map(color => ({
      ...color,
      images: prioritizeUserImages(color.images || []),
      patternImage: color.patternImage && isUserUploadedImage(color.patternImage)
        ? color.patternImage
        : getBestImage(color.images || []) || color.patternImage
    })),

    // Process combinations
    combinations: (stock.combinations || []).map(combination => ({
      ...combination,
      images: prioritizeUserImages(combination.images || [])
    }))
  };
};

// Get the best available images for display, considering user uploads first
export const getDisplayImages = (
  stock: EnhancedStockItem,
  colorId?: string,
  sizeId?: string
): string[] => {
  if (!stock) return [];
  
  // First try to get combination-specific images
  const combination = (stock.combinations || []).find(c =>
    c.colorId === colorId && c.sizeId === sizeId
  );
  if (combination && (combination.images || []).length > 0) {
    const prioritized = prioritizeUserImages(combination.images);
    const userImages = prioritized.filter(isUserUploadedImage);
    if (userImages.length > 0) return userImages;
  }

  // Then try color-specific images
  if (colorId) {
    const color = (stock.colors || []).find(c => c.id === colorId);
    if (color && (color.images || []).length > 0) {
      const prioritized = prioritizeUserImages(color.images);
      const userImages = prioritized.filter(isUserUploadedImage);
      if (userImages.length > 0) return userImages;
    }
  }

  // Try main product images
  if (stock.mainImages && stock.mainImages.length > 0) {
    const prioritized = prioritizeUserImages(stock.mainImages);
    const userImages = prioritized.filter(isUserUploadedImage);
    if (userImages.length > 0) return userImages;
  }

  // Fallback to any available images (including demos) if no user images found
  if (combination && (combination.images || []).length > 0) {
    return prioritizeUserImages(combination.images);
  }

  if (colorId) {
    const color = (stock.colors || []).find(c => c.id === colorId);
    if (color && (color.images || []).length > 0) {
      return prioritizeUserImages(color.images);
    }
  }

  return stock.mainImages ? prioritizeUserImages(stock.mainImages) : [];
};

// Check if stock item has any user-uploaded images
export const hasUserUploadedImages = (stock: EnhancedStockItem): boolean => {
  if (!stock) return false;
  
  // Check main images
  if (stock.mainImages && stock.mainImages.some(isUserUploadedImage)) {
    return true;
  }

  // Check color images
  if (stock.colors && stock.colors.some(color =>
    (color.images || []).some(isUserUploadedImage) ||
    (color.patternImage && isUserUploadedImage(color.patternImage))
  )) {
    return true;
  }

  // Check combination images
  if (stock.combinations && stock.combinations.some(combination =>
    (combination.images || []).some(isUserUploadedImage)
  )) {
    return true;
  }

  return false;
};

// Create a display-ready version of stock data with image prioritization
export const createDisplayReadyStock = (stocks: EnhancedStockItem[]): EnhancedStockItem[] => {
  if (!stocks || !Array.isArray(stocks)) return [];
  return stocks.filter(Boolean).map(processStockItemImages);
};

// Log image prioritization info (for debugging)
export const logImagePrioritization = (stock: EnhancedStockItem): void => {
  if (process.env.NODE_ENV === 'development') {
    const hasUserImages = hasUserUploadedImages(stock);
    const mainImageCount = stock.mainImages?.length || 0;
    const userMainImages = stock.mainImages?.filter(isUserUploadedImage).length || 0;

    console.log(`Stock "${stock.name}" (${stock.id}):`, {
      hasUserImages,
      mainImages: { total: mainImageCount, userUploaded: userMainImages },
      colors: stock.colors.length,
      combinations: stock.combinations.length
    });
  }
};