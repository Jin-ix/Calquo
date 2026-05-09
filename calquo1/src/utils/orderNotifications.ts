import { addDocument, updateDocument, getDocumentById } from './firebase/firestore';
import { OrderRequest } from '../components/context/OrderProvider';
import { toast } from 'sonner@2.0.3';

/**
 * Save order to Firestore database
 */
export async function saveOrderToFirestore(order: OrderRequest): Promise<string | null> {
  try {
    const orderData = {
      // Order identification
      order_number: order.id,
      order_date: order.orderDate,
      
      // Buyer information
      buyer_company: order.buyerCompany,
      buyer_email: order.buyerEmail,
      
      // Supplier information
      supplier_name: order.supplierName,
      supplier_id: order.supplierId || null,
      
      // Product information
      item_name: order.itemName,
      item_id: order.itemId || null,
      stock_id: order.stockId || null,
      stock_item_id: order.stockItemId || null,
      stock_name: order.stockName || null,
      category: order.category || null,
      
      // Quantity and pricing
      quantity: order.quantity,
      unit_price: order.unitPrice || order.pricePerUnit || 0,
      total_amount: order.totalAmount,
      
      // Order status
      status: order.status,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      
      // Delivery information
      delivery_address: order.deliveryAddress,
      delivery_city: order.deliveryCity || null,
      preferred_logistics_agent: order.preferredLogisticsAgent || null,
      special_instructions: order.specialInstructions || null,
      estimated_delivery: order.estimatedDelivery || null,
      tracking_number: order.trackingNumber || null,
      delivery_time: order.deliveryTime || null,
      
      // Additional dates
      acceptance_date: order.acceptanceDate || null,
      confirmation_date: order.confirmationDate || null,
      
      // Additional flags
      needs_payment_confirmation: order.needsPaymentConfirmation || false,
      rejection_reason: order.rejectionReason || null,
      
      // Enhanced stock system
      item_set_type: order.itemSetType || null,
      selected_combinations: order.selectedCombinations || null,
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docId = await addDocument('orders', orderData);
    console.log('[OrderNotifications] Order saved to Firestore:', docId);
    return docId;
  } catch (error) {
    console.error('[OrderNotifications] Error saving order to Firestore:', error);
    toast.error('Failed to save order to database');
    return null;
  }
}

/**
 * Update order in Firestore
 */
export async function updateOrderInFirestore(
  orderId: string, 
  updates: Partial<OrderRequest>
): Promise<boolean> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Map OrderRequest fields to Firestore field names
    if (updates.status) updateData.status = updates.status;
    if (updates.paymentStatus) updateData.payment_status = updates.paymentStatus;
    if (updates.paymentMethod) updateData.payment_method = updates.paymentMethod;
    if (updates.trackingNumber) updateData.tracking_number = updates.trackingNumber;
    if (updates.estimatedDelivery) updateData.estimated_delivery = updates.estimatedDelivery;
    if (updates.acceptanceDate) updateData.acceptance_date = updates.acceptanceDate;
    if (updates.confirmationDate) updateData.confirmation_date = updates.confirmationDate;
    if (updates.rejectionReason) updateData.rejection_reason = updates.rejectionReason;
    if (updates.needsPaymentConfirmation !== undefined) {
      updateData.needs_payment_confirmation = updates.needsPaymentConfirmation;
    }

    await updateDocument('orders', orderId, updateData);
    console.log('[OrderNotifications] Order updated in Firestore:', orderId);
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error updating order in Firestore:', error);
    return false;
  }
}

/**
 * Send notification message to supplier about new order
 */
export async function notifySupplierAboutOrder(order: OrderRequest): Promise<boolean> {
  try {
    const notification = {
      type: 'new_order',
      title: 'New Order Received',
      message: `${order.buyerCompany} has placed an order for ${order.quantity} units of ${order.itemName}`,
      
      // Recipient information
      recipient_type: 'supplier',
      recipient_id: order.supplierId || order.supplierName,
      recipient_name: order.supplierName,
      
      // Order details
      order_id: order.id,
      order_number: order.id,
      buyer_company: order.buyerCompany,
      buyer_email: order.buyerEmail,
      item_name: order.itemName,
      quantity: order.quantity,
      total_amount: order.totalAmount,
      delivery_city: order.deliveryCity || 'Not specified',
      
      // Notification metadata
      read: false,
      priority: 'high',
      actionable: true,
      action_url: `/orders/${order.id}`,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    const notificationId = await addDocument('notifications', notification);
    console.log('[OrderNotifications] Supplier notification created:', notificationId);
    
    // Also create a message in the supplier's inbox
    await createSupplierMessage(order);
    
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error sending supplier notification:', error);
    return false;
  }
}

/**
 * Create a message in supplier's message inbox
 */
async function createSupplierMessage(order: OrderRequest): Promise<boolean> {
  try {
    const message = {
      type: 'order_request',
      subject: `New Order Request: ${order.itemName}`,
      body: `You have received a new order request from ${order.buyerCompany}.
      
Order Details:
- Order ID: ${order.id}
- Product: ${order.itemName}
- Quantity: ${order.quantity} units
- Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
- Delivery City: ${order.deliveryCity || 'Not specified'}

${order.specialInstructions ? `Special Instructions: ${order.specialInstructions}` : ''}

Please review and accept this order from your dashboard.`,
      
      // Sender information
      sender_company: order.buyerCompany,
      sender_email: order.buyerEmail,
      
      // Recipient information
      recipient_type: 'supplier',
      recipient_id: order.supplierId || order.supplierName,
      recipient_name: order.supplierName,
      
      // Order reference
      order_id: order.id,
      order_reference: order.id,
      
      // Message status
      read: false,
      status: 'new',
      priority: 'high',
      
      // Timestamps
      createdAt: new Date().toISOString(),
      read_at: null
    };

    const messageId = await addDocument('messages', message);
    console.log('[OrderNotifications] Supplier message created:', messageId);
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error creating supplier message:', error);
    return false;
  }
}

/**
 * Send notification to buyer about order status change
 */
export async function notifyBuyerAboutOrderStatus(
  order: OrderRequest,
  status: string,
  additionalInfo?: string
): Promise<boolean> {
  try {
    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    switch (status) {
      case 'accepted':
        title = 'Order Accepted';
        message = `${order.supplierName} has accepted your order for ${order.itemName}`;
        priority = 'high';
        break;
      case 'rejected':
        title = 'Order Rejected';
        message = `${order.supplierName} has rejected your order. ${additionalInfo || ''}`;
        priority = 'high';
        break;
      case 'confirmed':
        title = 'Order Confirmed';
        message = `Your order for ${order.itemName} has been confirmed and is being processed`;
        priority = 'high';
        break;
      case 'shipped':
        title = 'Order Shipped';
        message = `Your order for ${order.itemName} has been shipped. ${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;
        priority = 'high';
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = `Your order for ${order.itemName} has been delivered successfully`;
        priority = 'high';
        break;
      default:
        title = 'Order Status Updated';
        message = `Your order status has been updated to: ${status}`;
    }

    const notification = {
      type: `order_${status}`,
      title,
      message,
      
      // Recipient information
      recipient_type: 'buyer',
      recipient_id: order.buyerEmail,
      recipient_name: order.buyerCompany,
      
      // Order details
      order_id: order.id,
      order_number: order.id,
      supplier_name: order.supplierName,
      item_name: order.itemName,
      
      // Notification metadata
      read: false,
      priority,
      actionable: true,
      action_url: `/my-orders/${order.id}`,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const notificationId = await addDocument('notifications', notification);
    console.log('[OrderNotifications] Buyer notification created:', notificationId);
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error sending buyer notification:', error);
    return false;
  }
}

/**
 * Helper function to send order-related email (if email service is configured)
 */
export async function sendOrderEmail(
  to: string,
  subject: string,
  body: string,
  orderData: OrderRequest
): Promise<boolean> {
  try {
    // Save email to pending emails collection for batch processing
    const email = {
      to,
      subject,
      body,
      order_id: orderData.id,
      order_data: {
        order_number: orderData.id,
        item_name: orderData.itemName,
        quantity: orderData.quantity,
        total_amount: orderData.totalAmount,
        buyer_company: orderData.buyerCompany,
        supplier_name: orderData.supplierName
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0
    };

    await addDocument('pending_emails', email);
    console.log('[OrderNotifications] Email queued for sending');
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error queuing email:', error);
    return false;
  }
}

/**
 * Complete order workflow: Save to Firestore + Notify Supplier
 */
export async function processNewOrder(order: OrderRequest): Promise<boolean> {
  try {
    console.log('[OrderNotifications] Processing new order:', order.id);
    
    // 1. Save order to Firestore
    const firestoreId = await saveOrderToFirestore(order);
    if (!firestoreId) {
      throw new Error('Failed to save order to Firestore');
    }
    
    // 2. Send notification to supplier
    const notificationSent = await notifySupplierAboutOrder(order);
    if (!notificationSent) {
      console.warn('[OrderNotifications] Failed to send supplier notification');
    }
    
    // 3. Optionally queue email notification
    if (order.buyerEmail) {
      await sendOrderEmail(
        order.buyerEmail,
        `Order Confirmation - ${order.id}`,
        `Your order has been placed successfully. Order ID: ${order.id}`,
        order
      );
    }
    
    console.log('[OrderNotifications] Order processing complete');
    return true;
  } catch (error) {
    console.error('[OrderNotifications] Error processing new order:', error);
    toast.error('Order was placed but notification failed. Please contact support.');
    return false;
  }
}
