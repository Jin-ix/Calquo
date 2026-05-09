import { EnhancedStockItem } from '../components/stock/EnhancedStockTypes';

export type PurchaseRequestStatus =
  | 'pending_multi_party_approval' // Waiting for seller, logistics, financial agent approvals
  | 'pending_seller_ack'
  | 'accepted'
  | 'rejected'
  | 'seller_acknowledged'
  | 'pending_agent'
  | 'logistics_rejected' // Logistics rejected, buyer can reselect
  | 'approved' // All parties approved
  | 'payment_pending' // For direct payment before completion
  | 'paid'
  | 'cancelled'
  // Escrow Proposal States
  | 'request_sent'
  | 'proposal_drafted'
  | 'pending_seller_approval'
  | 'terms_accepted'
  | 'terms_rejected'
  | 'awaiting_funds'
  | 'funds_held_in_escrow'
  | 'shipped_to_middleman'
  | 'qc_verified'
  | 'completed_and_released'
  | 'negotiating_agent'
  | 'agent_locked';

export interface PurchaseRequestItem {
  combinationId: string;
  colorId?: string;
  sizeId?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface PurchaseRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  buyerGST?: string;

  sellerId: string;
  sellerName: string;
  sellerCompany: string;

  stockId: string;
  stockName: string;
  stockImage?: string;

  items: PurchaseRequestItem[];
  totalAmount: number;
  totalQuantity: number;

  status: PurchaseRequestStatus;
  createdAt: string;
  updatedAt: string;

  // Payment mode: 'direct' (buyer pays via Razorpay) or 'finance' (through financial agent)
  paymentMode?: 'direct' | 'finance';

  // Logistics Agent (required)
  logisticsAgentId?: string;
  logisticsAgentName?: string;
  logisticsAgentMobile?: string;

  // Financial Agent (required only if paymentMode === 'finance')
  financialAgentId?: string;
  financialAgentName?: string;

  // Approval tracking
  sellerApproval?: 'pending' | 'approved' | 'rejected';
  logisticsApproval?: 'pending' | 'approved' | 'rejected';
  financialApproval?: 'pending' | 'approved' | 'rejected';

  // Escrow & Middleman Fields (B2B Consensus Protocol)
  proposed_middleman_id?: string | null;
  proposing_party?: 'buyer' | 'seller' | null;
  agreed_middleman_id?: string | null;
  escrow_status?: 'not_requested' | 'negotiating_agent' | 'agent_locked';
  middleman_fee_payer?: 'buyer' | 'seller' | 'split' | null;
  middleman_city?: string | null;

  // Approval details (timestamps, reasons)
  approvals?: {
    seller?: {
      status: 'approved' | 'rejected';
      userId: string;
      userName: string;
      timestamp: string;
      reason?: string;
    };
    logistics?: {
      status: 'approved' | 'rejected';
      userId: string;
      userName: string;
      timestamp: string;
      reason?: string;
    };
    financial?: {
      status: 'approved' | 'rejected';
      userId: string;
      userName: string;
      timestamp: string;
      reason?: string;
    };
  };

  specialInstructions?: string;

  // Legacy fields (kept for backward compatibility)
  deliveryAddress?: string;
  expectedDeliveryDate?: string;
  shippingMethod?: 'standard' | 'express' | 'overnight';

  // Payment
  paymentMethod?: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'agent' | 'direct';
}

export interface FinancialPaymentRequest {
  id: string;
  purchaseRequestId: string;
  amount: number;

  agentId: string;
  buyerId: string;
  sellerId: string;

  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  transactionId?: string; // Razorpay payment ID
}

// Order status type
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  // Escrow Proposal States
  | 'request_sent'
  | 'proposal_drafted'
  | 'pending_seller_approval'
  | 'terms_accepted'
  | 'terms_rejected'
  | 'awaiting_funds'
  | 'funds_held_in_escrow'
  | 'shipped_to_middleman'
  | 'qc_verified'
  | 'completed_and_released';

// Order interface (created when seller accepts purchase request)
export interface Order extends Omit<PurchaseRequest, 'status'> {
  orderId: string; // Custom order number
  requestId: string; // Link to original purchase request

  status: OrderStatus;

  // Tracking info
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;

  // Review (after completion)
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
}