/**
 * purchaseService.ts
 * Fully migrated to Supabase. All Firebase/Firestore references removed.
 * Uses addDocument / updateDocument / getDocuments from the Supabase shim.
 */

import { addDocument, updateDocument, getDocuments } from './firestore';
import { supabase } from '../supabase/client';
import { PurchaseRequest, PurchaseRequestStatus } from '../../types/purchaseTypes';

const PURCHASE_REQUESTS_TABLE = 'purchase_requests';
const ORDERS_TABLE = 'orders';
const NOTIFICATIONS_TABLE = 'notifications';
const PAYMENTS_TABLE = 'payments';

// ---------------------------------------------------------------------------
// Internal helper: persist a notification row in Supabase
// ---------------------------------------------------------------------------
const sendNotification = async (
  recipientId: string,
  title: string,
  message: string,
  type: string,
  data?: any
) => {
  try {
    if (!recipientId) return;
    await addDocument(NOTIFICATIONS_TABLE, {
      user_id: recipientId,
      content: `${title}: ${message}`,
      title,
      message,
      type,
      data: data || {},
      is_read: false,
    });
  } catch (error) {
    // Non-fatal — log and continue
    console.warn('[purchaseService] sendNotification failed:', error);
  }
};

// ---------------------------------------------------------------------------
// purchaseService — all methods wired to Supabase
// ---------------------------------------------------------------------------
export const purchaseService = {

  // ─── Create a new purchase request ─────────────────────────────────────
  createRequest: async (requestData: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const payload = {
        buyer_id:      requestData.buyerId,
        buyer_name:    requestData.buyerName,
        buyer_company: requestData.buyerCompany,
        buyer_gst:     requestData.buyerGST || null,
        seller_id:     requestData.sellerId,
        seller_name:   requestData.sellerName,
        seller_company: requestData.sellerCompany || requestData.sellerName,
        stock_id:      requestData.stockId,
        stock_name:    requestData.stockName,
        stock_image:   requestData.stockImage || null,
        items:         requestData.items,
        total_amount:  requestData.totalAmount,
        total_quantity: requestData.totalQuantity,
        status:        requestData.status || 'pending_seller_ack',
        payment_mode:  (requestData as any).paymentMode || 'direct',
        special_instructions: requestData.specialInstructions || null,
        logistics_agent_id: requestData.logisticsAgentId || null,
        financial_agent_id: requestData.financialAgentId || null,
      };

      const requestId = await addDocument(PURCHASE_REQUESTS_TABLE, payload);

      if (!requestId) throw new Error('Failed to get request ID from Supabase insert');

      // Notify Seller
      if (requestData.sellerId) {
        await sendNotification(
          requestData.sellerId,
          '🛍️ New Purchase Request',
          `New request from ${requestData.buyerCompany || requestData.buyerName} for ${requestData.stockName}`,
          'purchase_request_received',
          { requestId }
        );
      }

      // Notify Logistics Agent (if provided)
      if (requestData.logisticsAgentId) {
        await sendNotification(
          requestData.logisticsAgentId,
          '🚚 New Delivery Request',
          `You've been assigned to deliver ${requestData.stockName}`,
          'logistics_request_received',
          { requestId }
        );
      }

      return requestId;
    } catch (error) {
      console.error('[purchaseService] createRequest error:', error);
      throw error;
    }
  },

  // ─── Update request status ──────────────────────────────────────────────
  updateStatus: async (requestId: string, status: PurchaseRequestStatus, additionalData?: any) => {
    try {
      await updateDocument(PURCHASE_REQUESTS_TABLE, requestId, {
        status,
        ...additionalData,
      });

      // Fetch to get buyer_id for notification
      const rows = await getDocuments(PURCHASE_REQUESTS_TABLE, []);
      const req = rows.find((r: any) => r.id === requestId);
      if (!req) return;

      if (status === 'seller_acknowledged') {
        await sendNotification(
          req.buyer_id,
          '✅ Request Acknowledged',
          `Your purchase request for ${req.stock_name} has been acknowledged`,
          'request_acknowledged',
          { requestId }
        );
      } else if (status === 'rejected') {
        await sendNotification(
          req.buyer_id,
          '❌ Request Rejected',
          `Your purchase request for ${req.stock_name} was rejected`,
          'request_rejected',
          { requestId }
        );
      }
    } catch (error) {
      console.error('[purchaseService] updateStatus error:', error);
      throw error;
    }
  },

  // ─── Update arbitrary request fields ───────────────────────────────────
  updateRequest: async (requestId: string, data: Partial<PurchaseRequest>) => {
    try {
      // Map camelCase to snake_case where needed
      const payload: Record<string, any> = { ...data };
      if ('buyerId' in data)   { payload.buyer_id = data.buyerId; delete payload.buyerId; }
      if ('sellerId' in data)  { payload.seller_id = data.sellerId; delete payload.sellerId; }
      if ('totalAmount' in data) { payload.total_amount = data.totalAmount; delete payload.totalAmount; }
      if ('updatedAt' in data) delete payload.updatedAt;  // managed by shim

      await updateDocument(PURCHASE_REQUESTS_TABLE, requestId, payload);
    } catch (error) {
      console.error('[purchaseService] updateRequest error:', error);
      throw error;
    }
  },

  // ─── Assign financial agent ─────────────────────────────────────────────
  assignAgent: async (requestId: string, agentId: string, agentName: string) => {
    try {
      await updateDocument(PURCHASE_REQUESTS_TABLE, requestId, {
        status: 'pending_agent',
        financial_agent_id: agentId,
        financial_agent_name: agentName,
      });

      // Create a payment request record
      const rows = await getDocuments(PURCHASE_REQUESTS_TABLE, []);
      const req = rows.find((r: any) => r.id === requestId);

      if (req) {
        await addDocument(PAYMENTS_TABLE, {
          purchase_request_id: requestId,
          amount: req.total_amount,
          agent_id: agentId,
          buyer_id: req.buyer_id,
          seller_id: req.seller_id,
          stock_name: req.stock_name,
          buyer_company: req.buyer_company,
          seller_company: req.seller_company,
          status: 'pending',
        });

        await sendNotification(
          agentId,
          '💰 New Payment Request',
          `Payment request for ${req.buyer_company} — ₹${req.total_amount?.toLocaleString()}`,
          'payment_request_received',
          { requestId }
        );
      }
    } catch (error) {
      console.error('[purchaseService] assignAgent error:', error);
      throw error;
    }
  },

  // ─── Complete payment ───────────────────────────────────────────────────
  completePayment: async (requestId: string, transactionId: string, paymentMethod: 'agent' | 'direct') => {
    try {
      await updateDocument(PURCHASE_REQUESTS_TABLE, requestId, { status: 'paid' });

      const rows = await getDocuments(PURCHASE_REQUESTS_TABLE, []);
      const req = rows.find((r: any) => r.id === requestId);
      if (!req) throw new Error('Purchase request not found');

      // Create order
      const orderId = await addDocument(ORDERS_TABLE, {
        purchase_request_id: requestId,
        buyer_id:    req.buyer_id,
        seller_id:   req.seller_id,
        items:       req.items,
        total_amount: req.total_amount,
        status:      'confirmed',
        payment_status: 'paid',
        payment_method: paymentMethod,
        transaction_id: transactionId,
        order_date:  new Date().toISOString(),
      });

      // Update payment record if agent-based
      if (paymentMethod === 'agent' && req.financial_agent_id) {
        const payments = await getDocuments(PAYMENTS_TABLE, []);
        const payment = payments.find((p: any) => p.purchase_request_id === requestId && p.status === 'pending');
        if (payment?.id) {
          await updateDocument(PAYMENTS_TABLE, payment.id, {
            status: 'completed',
            transaction_id: transactionId,
            completed_at: new Date().toISOString(),
          });
        }
      }

      // Notify Buyer
      await sendNotification(req.buyer_id, '✅ Order Confirmed', `Payment successful for ${req.stock_name}`, 'order_confirmed', { orderId });
      // Notify Seller
      await sendNotification(req.seller_id, '📦 Order Received', `New confirmed order from ${req.buyer_company}`, 'order_confirmed', { orderId });

      return true;
    } catch (error) {
      console.error('[purchaseService] completePayment error:', error);
      throw error;
    }
  },

  // ─── Mark request as paid (called from BuyNowFlow) ─────────────────────
  markRequestPaid: async (requestId: string, orderId: string) => {
    try {
      await updateDocument(PURCHASE_REQUESTS_TABLE, requestId, {
        status: 'paid',
        linked_order_id: orderId,
      });

      const rows = await getDocuments(PURCHASE_REQUESTS_TABLE, []);
      const req = rows.find((r: any) => r.id === requestId);
      if (!req) return;

      await sendNotification(req.buyer_id, '✅ Order Confirmed', `Order placed successfully. Order ID: ${orderId}`, 'order_confirmed', { orderId });
      await sendNotification(req.seller_id, '📦 New Order', `New order from ${req.buyer_company}. ID: ${orderId}`, 'order_confirmed', { orderId });
    } catch (error) {
      console.error('[purchaseService] markRequestPaid error:', error);
      throw error;
    }
  },

  // ─── Subscribe to requests for a user ──────────────────────────────────
  subscribeToRequests: (
    userId: string,
    role: 'buyer' | 'seller' | 'financial',
    callback: (requests: PurchaseRequest[]) => void
  ) => {
    if (!userId) {
      callback([]);
      return () => {};
    }

    const column = role === 'buyer' ? 'buyer_id' : role === 'seller' ? 'seller_id' : 'financial_agent_id';

    // Initial fetch
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from(PURCHASE_REQUESTS_TABLE)
          .select('*')
          .eq(column, userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[purchaseService] subscribeToRequests fetch error:', error);
          callback([]);
          return;
        }

        // Map snake_case → camelCase for compatibility with existing components
        const mapped = (data || []).map((r: any) => ({
          ...r,
          id:            r.id,
          buyerId:       r.buyer_id,
          buyerName:     r.buyer_name,
          buyerCompany:  r.buyer_company,
          sellerId:      r.seller_id,
          sellerName:    r.seller_name,
          sellerCompany: r.seller_company,
          stockId:       r.stock_id,
          stockName:     r.stock_name,
          stockImage:    r.stock_image,
          totalAmount:   r.total_amount,
          totalQuantity: r.total_quantity,
          createdAt:     r.created_at,
          updatedAt:     r.updated_at,
          logisticsAgentId:  r.logistics_agent_id,
          financialAgentId:  r.financial_agent_id,
          specialInstructions: r.special_instructions,
        })) as PurchaseRequest[];
        callback(mapped);
      } catch (e) {
        console.error('[purchaseService] subscribeToRequests error:', e);
        callback([]);
      }
    };

    fetchData();

    // Real-time subscription via Supabase Realtime
    const channel = supabase
      .channel(`purchase_requests_${role}_${userId}_${Date.now()}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: PURCHASE_REQUESTS_TABLE, filter: `${column}=eq.${userId}` },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // ─── Delete a request ───────────────────────────────────────────────────
  deleteRequest: async (requestId: string) => {
    try {
      const { error } = await supabase.from(PURCHASE_REQUESTS_TABLE).delete().eq('id', requestId);
      if (error) throw error;
    } catch (error) {
      console.error('[purchaseService] deleteRequest error:', error);
      throw error;
    }
  },
};