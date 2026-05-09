import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firebaseDb } from './config';
import { notificationService } from './notificationService';

export interface ApprovalDecision {
  requestId: string;
  role: 'seller' | 'logistics' | 'financial';
  decision: 'approved' | 'rejected';
  userId: string;
  userName: string;
  reason?: string;
}

class ApprovalService {
  /**
   * Handle approval/rejection from any party (seller, logistics, financial agent)
   */
  async handleApprovalDecision(decision: ApprovalDecision): Promise<void> {
    if (!firebaseDb) {
      console.warn('Firebase DB not initialized');
      return;
    }

    try {
      const requestRef = doc(firebaseDb, 'purchase_requests', decision.requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('Purchase request not found');
      }

      const requestData = requestSnap.data();
      const currentApprovals = requestData.approvals || {};

      // Update the specific approval
      currentApprovals[decision.role] = {
        status: decision.decision,
        userId: decision.userId,
        userName: decision.userName,
        timestamp: new Date().toISOString(),
        reason: decision.reason
      };

      // Determine new status based on all approvals
      let newStatus = requestData.status;

      if (decision.decision === 'rejected') {
        if (decision.role === 'seller' || decision.role === 'financial') {
          // Seller or financial agent rejection = order cancelled
          newStatus = 'cancelled';
        } else if (decision.role === 'logistics') {
          // Logistics rejection = allow buyer to select another partner
          newStatus = 'pending_logistics_reselection';
        }
      } else {
        // Check if all required parties have approved
        const sellerApproved = currentApprovals.seller?.status === 'approved';
        const logisticsApproved = currentApprovals.logistics?.status === 'approved';
        const financialApproved = requestData.paymentMode === 'finance' 
          ? currentApprovals.financial?.status === 'approved'
          : true; // Not required for direct payment

        if (sellerApproved && logisticsApproved && financialApproved) {
          // All parties approved - move to payment phase
          if (requestData.paymentMode === 'direct') {
            // Direct payment: Move to awaiting payment
            newStatus = 'awaiting_payment';
          } else if (requestData.paymentMode === 'finance') {
            // Finance payment: Mark as confirmed (finance agent will handle payment)
            newStatus = 'confirmed';
          } else {
            // Fallback for other payment modes
            newStatus = 'awaiting_payment';
          }
        }
      }

      // Update the request
      await updateDoc(requestRef, {
        approvals: currentApprovals,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Send notifications
      await notificationService.notifyApprovalDecision({
        requestId: decision.requestId,
        approverRole: decision.role,
        approverName: decision.userName,
        decision: decision.decision,
        buyerId: requestData.buyerId,
        sellerId: requestData.sellerId,
        logisticsPartnerId: requestData.logisticsPartnerId,
        financialAgentId: requestData.financialAgentId,
        itemName: requestData.stockName,
        amount: requestData.totalAmount
      });

      // If all parties approved, send special notification to buyer
      if (newStatus === 'awaiting_payment' || newStatus === 'confirmed') {
        const sellerApproved = currentApprovals.seller?.status === 'approved';
        const logisticsApproved = currentApprovals.logistics?.status === 'approved';
        const financialApproved = requestData.paymentMode === 'finance' 
          ? currentApprovals.financial?.status === 'approved'
          : true;

        if (sellerApproved && logisticsApproved && financialApproved) {
          // Notify buyer that all approvals are complete
          await notificationService.sendNotification({
            recipientId: requestData.buyerId,
            type: 'all_approvals_complete',
            title: '✅ All Approvals Complete!',
            message: newStatus === 'awaiting_payment' 
              ? `Your order for ${requestData.stockName} has been approved by all parties. Please proceed with payment of ₹${requestData.totalAmount?.toLocaleString()}.`
              : `Your order for ${requestData.stockName} has been fully approved and confirmed. Finance will process the payment.`,
            actionUrl: `/orders`,
            metadata: {
              requestId: decision.requestId,
              orderId: decision.requestId,
              itemName: requestData.stockName,
              amount: requestData.totalAmount,
              status: newStatus,
              paymentMode: requestData.paymentMode
            }
          });

          console.log(`🎉 All parties approved request ${decision.requestId} - Status: ${newStatus}`);
        }
      }

      console.log(`✅ ${decision.role} ${decision.decision} request ${decision.requestId}`);
    } catch (error) {
      console.error('Error handling approval decision:', error);
      throw error;
    }
  }

  /**
   * Reselect logistics partner after rejection
   */
  async reselectLogisticsPartner(params: {
    requestId: string;
    newLogisticsPartnerId: string;
    newLogisticsPartnerName: string;
    newLogisticsPartnerMobile?: string;
  }): Promise<void> {
    if (!firebaseDb) {
      console.warn('Firebase DB not initialized');
      return;
    }

    try {
      const requestRef = doc(firebaseDb, 'purchase_requests', params.requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('Purchase request not found');
      }

      const requestData = requestSnap.data();
      const currentApprovals = requestData.approvals || {};

      // Reset logistics approval
      currentApprovals.logistics = null;

      // Update logistics partner info
      const allPartiesInfo = requestData.allPartiesInfo || {};
      allPartiesInfo.logistics = {
        id: params.newLogisticsPartnerId,
        name: params.newLogisticsPartnerName,
        mobile: params.newLogisticsPartnerMobile
      };

      await updateDoc(requestRef, {
        logisticsPartnerId: params.newLogisticsPartnerId,
        logisticsPartnerName: params.newLogisticsPartnerName,
        logisticsPartnerMobile: params.newLogisticsPartnerMobile,
        allPartiesInfo,
        approvals: currentApprovals,
        status: 'pending_multi_party_approval',
        updatedAt: new Date().toISOString()
      });

      // Notify new logistics partner
      await notificationService.sendNotification({
        recipientId: params.newLogisticsPartnerId,
        type: 'logistics_assignment',
        title: '🚚 New Logistics Request',
        message: `You've been assigned to deliver ${requestData.stockName} from ${requestData.sellerCompany || requestData.sellerName} to ${requestData.buyerCompany || requestData.buyerName}`,
        actionUrl: `/orders`,
        metadata: {
          requestId: params.requestId,
          orderId: params.requestId,
          buyerName: requestData.buyerName,
          sellerName: requestData.sellerName,
          itemName: requestData.stockName,
          amount: requestData.totalAmount,
          quantity: requestData.totalQuantity
        }
      });

      console.log(`✅ Logistics partner reselected for request ${params.requestId}`);
    } catch (error) {
      console.error('Error reselecting logistics partner:', error);
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();