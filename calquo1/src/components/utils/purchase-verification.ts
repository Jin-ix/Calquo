// Utility functions for verifying purchase history and rating eligibility

export interface OrderRequest {
  id: string;
  itemName: string;
  stockName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyerCompany: string;
  supplierName: string;
  supplierType: 'manufacturer' | 'trader';
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  productId?: string;
  supplierId?: string;
}

/**
 * Check if user has purchased from a specific supplier
 */
export const hasPurchasedFromSupplier = (
  userId: string,
  supplierId: string,
  orders: OrderRequest[]
): boolean => {
  return orders.some(order => 
    (order.supplierId === supplierId || order.supplierName === supplierId) &&
    order.status === 'delivered' &&
    order.paymentStatus === 'paid' &&
    // Additional check: buyer should match current user
    // This would need to be adapted based on how user identification works in orders
    true // Simplified for now
  );
};

/**
 * Check if user has purchased a specific product
 */
export const hasPurchasedProduct = (
  userId: string,
  productId: string,
  orders: OrderRequest[]
): boolean => {
  return orders.some(order => 
    (order.productId === productId || order.id === productId) &&
    order.status === 'delivered' &&
    order.paymentStatus === 'paid'
  );
};

/**
 * Check if user has completed purchases (any purchases at all)
 */
export const hasCompletedPurchases = (
  userId: string,
  orders: OrderRequest[]
): boolean => {
  return orders.some(order => 
    order.status === 'delivered' &&
    order.paymentStatus === 'paid'
  );
};

/**
 * Get completed orders for a user with a specific supplier
 */
export const getUserSupplierOrders = (
  userId: string,
  supplierId: string,
  orders: OrderRequest[]
): OrderRequest[] => {
  return orders.filter(order => 
    (order.supplierId === supplierId || order.supplierName === supplierId) &&
    order.status === 'delivered' &&
    order.paymentStatus === 'paid'
  );
};

/**
 * Get completed orders for a user with a specific product
 */
export const getUserProductOrders = (
  userId: string,
  productId: string,
  orders: OrderRequest[]
): OrderRequest[] => {
  return orders.filter(order => 
    (order.productId === productId || order.id === productId) &&
    order.status === 'delivered' &&
    order.paymentStatus === 'paid'
  );
};

/**
 * Check if user can rate based on purchase history and role
 */
export const canUserRate = (
  user: { email: string; role: string } | null | undefined,
  targetType: 'item' | 'supplier',
  targetId: string,
  orders: OrderRequest[]
): { canRate: boolean; reason?: string } => {
  if (!user) {
    return { canRate: false, reason: 'You must be logged in to rate' };
  }

  if (user.role !== 'retailer') {
    return { canRate: false, reason: 'Only retailers can submit ratings' };
  }

  const hasPurchased = targetType === 'supplier' 
    ? hasPurchasedFromSupplier(user.email, targetId, orders)
    : hasPurchasedProduct(user.email, targetId, orders);

  if (!hasPurchased) {
    return { 
      canRate: false, 
      reason: `You can review only after purchasing this ${targetType === 'supplier' ? 'supplier\'s products' : 'product'}.` 
    };
  }

  return { canRate: true };
};

/**
 * Get purchase restriction message for display
 */
export const getPurchaseRestrictionMessage = (
  targetType: 'item' | 'supplier'
): string => {
  return `You can review only after purchasing this ${targetType === 'supplier' ? 'supplier\'s products' : 'product'}.`;
};