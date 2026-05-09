/**
 * CALICO - Payment Type Definitions
 * TypeScript interfaces for payment and order management
 */

/**
 * Payment Status
 */
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/**
 * Order Status
 */
export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'expired';

/**
 * Payment Method
 */
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

/**
 * Order Item
 */
export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  variantId?: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

/**
 * Discount Information
 */
export interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
}

/**
 * Order
 */
export interface Order {
  id: string;
  orderNumber: string;
  
  // User information
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  
  // Order items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  discount: number;
  discountInfo?: DiscountInfo;
  tax: number;
  shippingCost: number;
  total: number;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Payment information
  paymentMethod?: PaymentMethod;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  
  // Shipping information
  shippingAddress?: Address;
  estimatedDelivery?: string;
  trackingNumber?: string;
  
  // Additional details
  notes?: string;
  specialInstructions?: string;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
  paidAt?: string | Date;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
  cancelledAt?: string | Date;
}

/**
 * Address
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Payment Session Request
 */
export interface CreatePaymentSessionRequest {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  variantId?: string;
  discountCode?: string;
  shippingAddress?: Address;
  notes?: string;
}

/**
 * Payment Session Response
 */
export interface CreatePaymentSessionResponse {
  sessionId: string;
  orderId: string;
  checkoutUrl?: string;
}

/**
 * Payment Verification Request
 */
export interface VerifyPaymentRequest {
  sessionId: string;
}

/**
 * Payment Verification Response
 */
export interface VerifyPaymentResponse {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  session: {
    id: string;
    status: string;
  };
}

/**
 * Order Update Data
 */
export interface OrderUpdateData {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
}

/**
 * Refund Request
 */
export interface RefundRequest {
  orderId: string;
  amount?: number; // Partial refund amount (optional)
  reason: string;
}

/**
 * Refund Response
 */
export interface RefundResponse {
  refundId: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  orderId: string;
}