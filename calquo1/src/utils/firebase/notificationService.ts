import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb } from './config';

export interface NotificationData {
  recipientId: string;
  recipientEmail?: string;
  type: 'purchase_request' | 'order_approval' | 'order_rejection' | 'logistics_assignment' | 'payment_update';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    requestId?: string;
    amount?: number;
    itemName?: string;
    buyerName?: string;
    sellerName?: string;
    [key: string]: any;
  };
}

class NotificationService {
  private notificationsCollection = 'notifications';

  /**
   * Send a notification to a single user
   */
  async sendNotification(data: NotificationData): Promise<string> {
    try {
      if (!firebaseDb) {
        console.warn('Firebase DB not initialized, skipping notification');
        return '';
      }

      const notificationDoc = {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(firebaseDb, this.notificationsCollection), notificationDoc);
      console.log(`✅ Notification sent to ${data.recipientId}:`, data.title);
      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notifications to multiple users at once
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<string[]> {
    try {
      const promises = notifications.map(notification => this.sendNotification(notification));
      const results = await Promise.allSettled(promises);
      
      const successfulIds = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);
      
      const failedCount = results.filter(result => result.status === 'rejected').length;
      
      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount} notifications failed to send`);
      }
      
      console.log(`✅ Sent ${successfulIds.length} notifications successfully`);
      return successfulIds;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send purchase request notifications to all relevant parties
   */
  async notifyPurchaseRequest(params: {
    requestId: string;
    buyerId: string;
    buyerName: string;
    buyerCompany?: string;
    buyerGST?: string;
    sellerId: string;
    sellerName: string;
    sellerCompany?: string;
    logisticsPartnerId: string;
    logisticsPartnerName: string;
    financialAgentId?: string;
    financialAgentName?: string;
    itemName: string;
    totalAmount: number;
    quantity: number;
    paymentMode: 'direct' | 'finance';
    paymentGateway?: 'razorpay' | 'paytm' | 'phonepe' | 'upi';
    items?: Array<{
      colorId?: string;
      sizeId?: string;
      quantity: number;
      pricePerUnit: number;
    }>;
    stockImage?: string;
    specialInstructions?: string;
  }): Promise<void> {
    const notifications: NotificationData[] = [];

    // Enhanced metadata with full request details
    const baseMetadata = {
      requestId: params.requestId,
      orderId: params.requestId,
      itemName: params.itemName,
      amount: params.totalAmount,
      quantity: params.quantity,
      paymentMode: params.paymentMode,
      paymentGateway: params.paymentGateway,
      stockImage: params.stockImage,
      specialInstructions: params.specialInstructions,
      items: params.items,
      createdAt: new Date().toISOString()
    };

    // 1. Notify Seller with complete buyer and order details
    notifications.push({
      recipientId: params.sellerId,
      type: 'purchase_request',
      title: '🛍️ New Purchase Request',
      message: `${params.buyerCompany || params.buyerName} has requested ${params.quantity} units of ${params.itemName} (₹${params.totalAmount.toLocaleString()})${params.paymentMode === 'direct' && params.paymentGateway ? ` - Payment via ${params.paymentGateway.toUpperCase()}` : ''}`,
      actionUrl: `/orders`,
      metadata: {
        ...baseMetadata,
        buyerName: params.buyerName,
        buyerCompany: params.buyerCompany,
        buyerGST: params.buyerGST,
        buyerId: params.buyerId,
        logisticsPartnerName: params.logisticsPartnerName,
        logisticsPartnerId: params.logisticsPartnerId,
        financialAgentName: params.financialAgentName,
        financialAgentId: params.financialAgentId,
        role: 'seller',
        actionRequired: 'approval'
      }
    });

    // 2. Notify Logistics Partner with complete pickup/delivery details
    notifications.push({
      recipientId: params.logisticsPartnerId,
      type: 'logistics_assignment',
      title: '🚚 New Logistics Request',
      message: `You've been assigned to deliver ${params.itemName} from ${params.sellerCompany || params.sellerName} to ${params.buyerCompany || params.buyerName}`,
      actionUrl: `/orders`,
      metadata: {
        ...baseMetadata,
        buyerName: params.buyerName,
        buyerCompany: params.buyerCompany,
        buyerId: params.buyerId,
        sellerName: params.sellerName,
        sellerCompany: params.sellerCompany,
        sellerId: params.sellerId,
        financialAgentName: params.financialAgentName,
        role: 'logistics',
        actionRequired: 'approval',
        deliveryDetails: {
          from: params.sellerCompany || params.sellerName,
          to: params.buyerCompany || params.buyerName,
          itemName: params.itemName,
          quantity: params.quantity
        }
      }
    });

    // 3. Notify Financial Agent (if finance mode) with complete credit request details
    if (params.financialAgentId && params.paymentMode === 'finance') {
      notifications.push({
        recipientId: params.financialAgentId,
        type: 'purchase_request',
        title: '💳 Credit Request',
        message: `${params.buyerCompany || params.buyerName} is requesting credit approval for ₹${params.totalAmount.toLocaleString()} purchase from ${params.sellerCompany || params.sellerName}`,
        actionUrl: `/orders`,
        metadata: {
          ...baseMetadata,
          buyerName: params.buyerName,
          buyerCompany: params.buyerCompany,
          buyerGST: params.buyerGST,
          buyerId: params.buyerId,
          sellerName: params.sellerName,
          sellerCompany: params.sellerCompany,
          sellerId: params.sellerId,
          logisticsPartnerName: params.logisticsPartnerName,
          logisticsPartnerId: params.logisticsPartnerId,
          role: 'financial',
          actionRequired: 'approval',
          creditDetails: {
            amount: params.totalAmount,
            buyer: params.buyerCompany || params.buyerName,
            seller: params.sellerCompany || params.sellerName,
            buyerGST: params.buyerGST
          }
        }
      });
    }

    // Send all notifications
    await this.sendBulkNotifications(notifications);
  }

  /**
   * Notify approval/rejection decisions
   */
  async notifyApprovalDecision(params: {
    requestId: string;
    approverRole: 'seller' | 'logistics' | 'financial';
    approverName: string;
    decision: 'approved' | 'rejected';
    buyerId: string;
    sellerId: string;
    logisticsPartnerId?: string;
    financialAgentId?: string;
    itemName: string;
    amount: number;
  }): Promise<void> {
    const notifications: NotificationData[] = [];
    const emoji = params.decision === 'approved' ? '✅' : '❌';
    const action = params.decision === 'approved' ? 'approved' : 'rejected';

    // Notify buyer about the decision
    notifications.push({
      recipientId: params.buyerId,
      type: 'order_approval',
      title: `${emoji} ${params.approverRole} ${action} your request`,
      message: `${params.approverName} has ${action} your purchase request for ${params.itemName}`,
      actionUrl: `/orders`,
      metadata: {
        requestId: params.requestId,
        orderId: params.requestId,
        approverRole: params.approverRole,
        decision: params.decision,
        itemName: params.itemName,
        amount: params.amount
      }
    });

    // If logistics rejected, notify seller too
    if (params.decision === 'rejected' && params.approverRole === 'logistics') {
      notifications.push({
        recipientId: params.sellerId,
        type: 'order_approval',
        title: `⚠️ Logistics Partner Declined`,
        message: `${params.approverName} declined the delivery request. Buyer can select another partner.`,
        actionUrl: `/orders`,
        metadata: {
          requestId: params.requestId,
          orderId: params.requestId,
          approverRole: params.approverRole,
          decision: params.decision,
          itemName: params.itemName
        }
      });
    }

    // If seller/financial rejected, notify all parties about cancellation
    if (params.decision === 'rejected' && (params.approverRole === 'seller' || params.approverRole === 'financial')) {
      // Notify logistics partner
      if (params.logisticsPartnerId) {
        notifications.push({
          recipientId: params.logisticsPartnerId,
          type: 'order_rejection',
          title: `❌ Order Cancelled`,
          message: `The ${params.approverRole} has rejected the order for ${params.itemName}. This delivery is cancelled.`,
          actionUrl: `/orders`,
          metadata: {
            requestId: params.requestId,
            orderId: params.requestId,
            itemName: params.itemName
          }
        });
      }

      // Notify financial agent (if involved and not the rejector)
      if (params.financialAgentId && params.approverRole !== 'financial') {
        notifications.push({
          recipientId: params.financialAgentId,
          type: 'order_rejection',
          title: `❌ Order Cancelled`,
          message: `The seller has rejected the order for ${params.itemName}. Credit request cancelled.`,
          actionUrl: `/orders`,
          metadata: {
            requestId: params.requestId,
            orderId: params.requestId,
            itemName: params.itemName
          }
        });
      }
    }

    await this.sendBulkNotifications(notifications);
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    try {
      if (!firebaseDb) return [];

      let q = query(
        collection(firebaseDb, this.notificationsCollection),
        where('recipientId', '==', userId)
      );

      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();