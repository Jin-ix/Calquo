/**
 * Utility function to format price in Indian Rupees
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '₹0';
  }
  
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return '₹0';
  }
  
  // Format with Indian numbering system (lakhs and crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Format price without currency symbol
 */
export function formatPriceNumber(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '0';
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Calculate percentage discount
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (!originalPrice || !discountedPrice || originalPrice <= 0) {
    return 0;
  }
  
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Format compact price for space-constrained displays
 */
export function formatCompactPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '₹0';
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return '₹0';
  }
  
  if (numericPrice >= 10000000) { // 1 crore
    return `₹${(numericPrice / 10000000).toFixed(1)}Cr`;
  } else if (numericPrice >= 100000) { // 1 lakh
    return `₹${(numericPrice / 100000).toFixed(1)}L`;
  } else if (numericPrice >= 1000) { // 1 thousand
    return `₹${(numericPrice / 1000).toFixed(1)}K`;
  } else {
    return `₹${numericPrice.toFixed(0)}`;
  }
}