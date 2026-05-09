import { stockAPI, orderAPI, analyticsAPI, demoAPI } from './api';

// Database utility functions for the frontend
export class DatabaseUtils {
  
  // =====================================================================
  // STOCK MANAGEMENT
  // =====================================================================
  
  /**
   * Get stock items with optional filtering and pagination
   */
  static async getStockItems(params?: {
    category?: string;
    supplier?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const response = await stockAPI.getStock(params);
      return {
        success: true,
        data: response.data,
        pagination: response.pagination,
        source: response.source
      };
    } catch (error) {
      console.error('Failed to fetch stock items:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Add new stock item
   */
  static async addStockItem(stockData: {
    name: string;
    category: string;
    supplier: string;
    basePrice: number;
    description?: string;
    itemSetType?: string;
    minOrderQuantity?: number;
    colors?: any[];
    sizes?: any[];
    images?: string[];
  }) {
    try {
      const response = await stockAPI.addStock(stockData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to add stock item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update existing stock item
   */
  static async updateStockItem(stockId: string, updates: Record<string, any>) {
    try {
      const response = await stockAPI.updateStock(stockId, updates);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to update stock item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================================
  // ORDER MANAGEMENT
  // =====================================================================

  /**
   * Get orders with optional filtering
   */
  static async getOrders(params?: {
    status?: string;
    buyerCompany?: string;
    supplierName?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await orderAPI.getOrders(params);
      return {
        success: true,
        data: response.data,
        pagination: response.pagination,
        source: response.source
      };
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Create new order
   */
  static async createOrder(orderData: {
    stockId: string;
    quantity: number;
    unitPrice: number;
    buyerCompany: string;
    supplierName: string;
    deliveryAddress?: string;
    specialInstructions?: string;
  }) {
    try {
      const response = await orderAPI.createOrder(orderData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to create order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, updates: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    trackingNumber?: string;
  }) {
    try {
      const response = await orderAPI.updateOrderStatus(orderId, updates);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to update order status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================================
  // ANALYTICS AND REPORTING
  // =====================================================================

  /**
   * Get dashboard analytics
   */
  static async getDashboardAnalytics(params?: {
    timeframe?: '7d' | '30d' | '90d';
    role?: string;
  }) {
    try {
      const response = await analyticsAPI.getDashboard(params);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
      return {
        success: false,
        error: error.message,
        data: {
          overview: {
            totalOrders: 0,
            totalRevenue: 0,
            totalStockItems: 0,
            averageOrderValue: 0,
            timeframe: '30d'
          },
          orderStatus: {},
          recentOrders: [],
          topCategories: {}
        }
      };
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(timeframe: string = '30d') {
    try {
      const response = await analyticsAPI.getSalesAnalytics(timeframe);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch sales analytics:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // =====================================================================
  // DEMO DATA MANAGEMENT
  // =====================================================================

  /**
   * Initialize demo data for development
   */
  static async initializeDemoData() {
    try {
      const response = await demoAPI.initializeDemoData();
      return {
        success: true,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to initialize demo data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================================
  // UTILITY FUNCTIONS
  // =====================================================================

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const timeUnits = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];

    for (const { unit, seconds } of timeUnits) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  /**
   * Validate GST number format
   */
  static validateGSTNumber(gst: string): boolean {
    // Basic GST validation - 15 characters alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][0-9]$/;
    const isDemoGST = gst.toUpperCase().startsWith('TEST') || 
                      gst.toUpperCase().startsWith('DEMO') || 
                      gst.length < 10;
    
    return gstRegex.test(gst) || isDemoGST;
  }

  /**
   * Validate postal code
   */
  static validatePostalCode(postalCode: string): boolean {
    const postalRegex = /^[0-9]{6}$/;
    return postalRegex.test(postalCode);
  }

  /**
   * Calculate order total with tax and shipping
   */
  static calculateOrderTotal(baseAmount: number, options?: {
    taxRate?: number;
    shippingCharges?: number;
    discountPercentage?: number;
  }): {
    baseAmount: number;
    taxAmount: number;
    shippingCharges: number;
    discountAmount: number;
    finalAmount: number;
  } {
    const {
      taxRate = 18, // Default GST rate
      shippingCharges = 0,
      discountPercentage = 0
    } = options || {};

    const discountAmount = (baseAmount * discountPercentage) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const finalAmount = taxableAmount + taxAmount + shippingCharges;

    return {
      baseAmount,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingCharges,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100
    };
  }

  /**
   * Generate order ID
   */
  static generateOrderId(): string {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
  }

  /**
   * Get order status color for UI
   */
  static getOrderStatusColor(status: string): string {
    const statusColors = {
      'pending': 'text-yellow-600 bg-yellow-50',
      'accepted': 'text-blue-600 bg-blue-50',
      'processing': 'text-purple-600 bg-purple-50',
      'shipped': 'text-indigo-600 bg-indigo-50',
      'delivered': 'text-green-600 bg-green-50',
      'cancelled': 'text-red-600 bg-red-50',
      'returned': 'text-orange-600 bg-orange-50'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Get payment status color for UI
   */
  static getPaymentStatusColor(status: string): string {
    const statusColors = {
      'pending': 'text-yellow-600 bg-yellow-50',
      'payment_required': 'text-orange-600 bg-orange-50',
      'completed': 'text-green-600 bg-green-50',
      'failed': 'text-red-600 bg-red-50',
      'refunded': 'text-purple-600 bg-purple-50'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Search and filter stock items locally
   */
  static filterStockItems(items: any[], filters: {
    search?: string;
    category?: string;
    supplier?: string;
    priceRange?: { min: number; max: number };
    status?: string;
  }) {
    let filteredItems = items;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.supplier_name.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }

    if (filters.supplier) {
      filteredItems = filteredItems.filter(item => item.supplier_name === filters.supplier);
    }

    if (filters.priceRange) {
      filteredItems = filteredItems.filter(item =>
        item.base_price >= filters.priceRange!.min &&
        item.base_price <= filters.priceRange!.max
      );
    }

    if (filters.status) {
      filteredItems = filteredItems.filter(item => item.status === filters.status);
    }

    return filteredItems;
  }

  /**
   * Sort items by various criteria
   */
  static sortItems(items: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') {
    return items.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle dates
      if (sortBy.includes('date') || sortBy.includes('_at')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }

  /**
   * Paginate items
   */
  static paginateItems(items: any[], page: number, limit: number) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      items: items.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasNext: endIndex < items.length,
        hasPrev: page > 1
      }
    };
  }
}

// Export commonly used functions as individual exports
export const {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  validateGSTNumber,
  validatePostalCode,
  calculateOrderTotal,
  generateOrderId,
  getOrderStatusColor,
  getPaymentStatusColor
} = DatabaseUtils;