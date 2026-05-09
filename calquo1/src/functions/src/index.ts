/**
 * CALIQUO - Firebase Cloud Functions
 * Stock Management & Business Logic
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const cors = require('cors')({origin: true});

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Razorpay (keys will be set via environment config)
let razorpayInstance: Razorpay | null = null;

const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    const keyId = functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

// ============================================================================
// STOCK MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all stock items with optional filters
 */
export const getStock = functions.https.onCall(async (data, context) => {
  try {
    const {
      category,
      color,
      min_price,
      max_price,
      search,
      company_id,
      page = 1,
      limit = 50
    } = data;

    let query: FirebaseFirestore.Query = db.collection('stock_items');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }

    if (company_id) {
      query = query.where('sellerId', '==', company_id);
    }

    // Price range filters would require composite indexes
    // For now, we'll fetch and filter in memory if needed

    // Execute query
    const snapshot = await query.get();
    let stocks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply additional filters in memory
    if (search) {
      const searchLower = search.toLowerCase();
      stocks = stocks.filter((stock: any) => 
        stock.name?.toLowerCase().includes(searchLower) ||
        stock.description?.toLowerCase().includes(searchLower) ||
        stock.category?.toLowerCase().includes(searchLower)
      );
    }

    if (color) {
      stocks = stocks.filter((stock: any) =>
        stock.colors?.some((c: any) => c.name?.toLowerCase() === color.toLowerCase())
      );
    }

    if (min_price !== undefined) {
      stocks = stocks.filter((stock: any) => stock.basePrice >= min_price);
    }

    if (max_price !== undefined) {
      stocks = stocks.filter((stock: any) => stock.basePrice <= max_price);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedStocks = stocks.slice(startIndex, startIndex + limit);

    return {
      success: true,
      stocks: paginatedStocks,
      data: paginatedStocks, // Alias for compatibility
      total: stocks.length,
      page,
      limit
    };
  } catch (error: any) {
    console.error('Get stock error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to fetch stock items'
    );
  }
});

/**
 * Get single stock item by ID
 */
export const getStockItem = functions.https.onCall(async (data, context) => {
  try {
    const { stockId } = data;

    if (!stockId) {
      throw new functions.https.HttpsError('invalid-argument', 'Stock ID is required');
    }

    const stockDoc = await db.collection('stock_items').doc(stockId).get();

    if (!stockDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Stock item not found');
    }

    return {
      success: true,
      stock: {
        id: stockDoc.id,
        ...stockDoc.data()
      }
    };
  } catch (error: any) {
    console.error('Get stock item error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to fetch stock item'
    );
  }
});

/**
 * Add new stock item
 */
export const addStock = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to add stock'
    );
  }

  try {
    const stockData = {
      ...data,
      sellerId: data.sellerId || context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: data.status || 'active'
    };

    // Add to Firestore
    const docRef = await db.collection('stock_items').add(stockData);

    console.log(`Stock item created: ${docRef.id} by user: ${context.auth.uid}`);

    // Return the created stock item
    const newDoc = await docRef.get();

    return {
      success: true,
      stock: {
        id: docRef.id,
        ...newDoc.data()
      },
      message: 'Stock item added successfully',
      id: docRef.id
    };
  } catch (error: any) {
    console.error('Add stock error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to add stock item'
    );
  }
});

/**
 * Update stock item
 */
export const updateStock = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update stock'
    );
  }

  try {
    const { stockId, updates } = data;

    if (!stockId) {
      throw new functions.https.HttpsError('invalid-argument', 'Stock ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new functions.https.HttpsError('invalid-argument', 'Updates object is required');
    }

    const stockRef = db.collection('stock_items').doc(stockId);
    const stockDoc = await stockRef.get();

    if (!stockDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Stock item not found');
    }

    // Verify ownership (optional - enable if needed)
    const stockData = stockDoc.data();
    // if (stockData?.sellerId !== context.auth.uid && !isAdmin(context)) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'You can only update your own stock items'
    //   );
    // }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Prevent overwriting certain fields
    delete updateData.sellerId;
    delete updateData.createdAt;
    delete updateData.id;

    // Update in Firestore
    await stockRef.update(updateData);

    console.log(`Stock item updated: ${stockId} by user: ${context.auth.uid}`);

    // Return updated stock item
    const updatedDoc = await stockRef.get();

    return {
      success: true,
      stock: {
        id: stockId,
        ...updatedDoc.data()
      },
      message: 'Stock item updated successfully'
    };
  } catch (error: any) {
    console.error('Update stock error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to update stock item'
    );
  }
});

/**
 * Delete stock item
 */
export const deleteStock = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Construct context and data to match onCall signature
    let auth = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        auth = { uid: decodedToken.uid, token: decodedToken };
      } catch (error) {
        console.error('Auth verification failed:', error);
      }
    }

    const context = { auth };
    // httpsCallable sends data wrapped in { data: ... }
    const data = (req.body && req.body.data) ? req.body.data : req.body;

    // Check authentication
    if (!context.auth) {
      res.status(401).send({ error: { message: 'User must be authenticated to delete stock', status: 'unauthenticated' } });
      return;
    }
  
    try {
      const { stockId } = data;
  
      if (!stockId) {
        res.status(400).send({ error: { message: 'Stock ID is required', status: 'invalid-argument' } });
        return;
      }
  
      const stockRef = db.collection('stock_items').doc(stockId);
      const stockDoc = await stockRef.get();
  
      if (!stockDoc.exists) {
        res.status(404).send({ error: { message: 'Stock item not found', status: 'not-found' } });
        return;
      }
  
      // Delete from Firestore
      await stockRef.delete();
  
      console.log(`Stock item deleted: ${stockId} by user: ${context.auth.uid}`);
  
      // Send success response in format compatible with httpsCallable
      res.status(200).send({ result: {
        success: true,
        message: 'Stock item deleted successfully'
      }});
    } catch (error: any) {
      console.error('Delete stock error:', error);
      res.status(500).send({ error: { message: error.message || 'Failed to delete stock item', status: 'internal' } });
    }
  });
});

// ============================================================================
// ORDER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get orders for the authenticated user
 */
export const getOrders = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { status, page = 1, limit = 50 } = data;

    let query: FirebaseFirestore.Query = db.collection('orders')
      .where('buyerId', '==', context.auth.uid);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory to avoid index issues
    orders.sort((a: any, b: any) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedOrders = orders.slice(startIndex, startIndex + limit);

    return {
      success: true,
      orders: paginatedOrders,
      total: orders.length
    };
  } catch (error: any) {
    console.error('Get orders error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create new order
 */
export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const orderData = {
      ...data,
      buyerId: context.auth.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('orders').add(orderData);

    return {
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully'
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Update order status
 */
export const updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { orderId, status, tracking_id, seller_notes } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID required');
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) updateData.status = status;
    if (tracking_id) updateData.tracking_id = tracking_id;
    if (seller_notes) updateData.seller_notes = seller_notes;

    await db.collection('orders').doc(orderId).update(updateData);

    return {
      success: true,
      message: 'Order updated successfully'
    };
  } catch (error: any) {
    console.error('Update order error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// PURCHASE REQUEST FUNCTIONS
// ============================================================================

/**
 * Get purchase requests
 */
export const getPurchaseRequests = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { status, page = 1, limit = 50 } = data;

    let query: FirebaseFirestore.Query = db.collection('purchase_requests')
      .where('buyerId', '==', context.auth.uid);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory to avoid index issues
    requests.sort((a: any, b: any) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    const startIndex = (page - 1) * limit;
    const paginatedRequests = requests.slice(startIndex, startIndex + limit);

    return {
      success: true,
      requests: paginatedRequests,
      total: requests.length
    };
  } catch (error: any) {
    console.error('Get purchase requests error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create purchase request
 */
export const createPurchaseRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const requestData = {
      ...data,
      buyerId: context.auth.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('purchase_requests').add(requestData);

    return {
      success: true,
      requestId: docRef.id,
      message: 'Purchase request created successfully'
    };
  } catch (error: any) {
    console.error('Create purchase request error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Update purchase request status
 */
export const updatePurchaseRequestStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { requestId, status, seller_notes } = data;

    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Request ID required');
    }

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) updateData.status = status;
    if (seller_notes) updateData.seller_notes = seller_notes;

    await db.collection('purchase_requests').doc(requestId).update(updateData);

    return {
      success: true,
      message: 'Purchase request updated successfully'
    };
  } catch (error: any) {
    console.error('Update purchase request error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Get user notifications
 */
export const getNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { read, page = 1, limit = 20 } = data;

    let query: FirebaseFirestore.Query = db.collection('notifications')
      .where('user_id', '==', context.auth.uid);

    if (read !== undefined) {
      query = query.where('is_read', '==', read);
    }

    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory
    notifications.sort((a: any, b: any) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    const startIndex = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(startIndex, startIndex + limit);

    return {
      success: true,
      notifications: paginatedNotifications,
      total: notifications.length,
      unreadCount: notifications.filter((n: any) => !n.is_read).length
    };
  } catch (error: any) {
    console.error('Get notifications error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Mark notification as read
 */
export const markNotificationRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Notification ID required');
    }

    await db.collection('notifications').doc(notificationId).update({
      is_read: true,
      read_at: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user is admin (helper function)
 */
function isAdmin(context: functions.https.CallableContext): boolean {
  return context.auth?.token?.admin === true;
}

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'healthy',
    service: 'CALIQUO Firebase Functions',
    timestamp: new Date().toISOString(),
    authenticated: !!context.auth
  };
});

// ============================================================================
// RAZORPAY PAYMENT FUNCTIONS
// ============================================================================

/**
 * Create Razorpay Order
 * Callable function to create a Razorpay order for payment processing
 */
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create orders'
    );
  }

  try {
    const { amount, currency = 'INR', receipt, notes } = data;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid amount is required (must be greater than 0)'
      );
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    console.log(`Creating Razorpay order for user: ${context.auth.uid}, amount: ₹${amount}`);

    // Get Razorpay instance
    const razorpay = getRazorpayInstance();

    // Create order options
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}_${context.auth.uid.substring(0, 8)}`,
      notes: {
        user_id: context.auth.uid,
        createdAt: new Date().toISOString(),
        ...notes
      }
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(orderOptions);

    console.log(`✅ Razorpay order created: ${order.id}`);

    // Store order details in Firestore
    await db.collection('razorpay_orders').doc(order.id).set({
      order_id: order.id,
      amount: amount,
      amount_in_paise: amountInPaise,
      currency: order.currency,
      receipt: order.receipt,
      status: 'created',
      user_id: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      razorpay_data: order
    });

    return {
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      receipt: order.receipt
    };
  } catch (error: any) {
    console.error('❌ Create Razorpay order error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create Razorpay order'
    );
  }
});

/**
 * Verify Razorpay Payment Signature
 * Verifies the payment signature to ensure authenticity
 */
export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required payment verification parameters'
      );
    }

    // Get key secret for verification
    const keySecret = functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
    
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Verify signature
    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      console.error('❌ Payment signature verification failed');
      throw new functions.https.HttpsError(
        'permission-denied',
        'Invalid payment signature'
      );
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id}`);

    // Update payment record in Firestore
    await db.collection('payments').add({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      user_id: context.auth.uid,
      status: 'verified',
      verified_at: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update Razorpay order status
    await db.collection('razorpay_orders').doc(razorpay_order_id).update({
      payment_id: razorpay_payment_id,
      payment_signature: razorpay_signature,
      status: 'paid',
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      verified: true,
      message: 'Payment verified successfully'
    };
  } catch (error: any) {
    console.error('❌ Verify payment error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Payment verification failed'
    );
  }
});

/**
 * Razorpay Webhook Handler
 * Handles Razorpay payment webhooks for real-time updates
 */
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature
    const webhookSecret = functions.config().razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const receivedSignature = req.headers['x-razorpay-signature'] as string;
      const webhookBody = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      if (receivedSignature !== expectedSignature) {
        console.error('❌ Webhook signature verification failed');
        res.status(400).send('Invalid signature');
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`📥 Razorpay webhook received: ${event}`);

    switch (event) {
      case 'payment.captured':
        // Payment successful
        await db.collection('payments').add({
          razorpay_payment_id: payload.id,
          razorpay_order_id: payload.order_id,
          amount: payload.amount / 100, // Convert from paise
          currency: payload.currency,
          status: 'captured',
          method: payload.method,
          email: payload.email,
          contact: payload.contact,
          captured_at: new Date(payload.createdAt * 1000).toISOString(),
          webhook_event: event,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update order status if order_id exists
        if (payload.order_id) {
          await db.collection('razorpay_orders').doc(payload.order_id).update({
            payment_id: payload.id,
            status: 'paid',
            payment_method: payload.method,
            paid_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        console.log(`✅ Payment captured: ${payload.id}`);
        break;

      case 'payment.failed':
        // Payment failed
        await db.collection('payment_failures').add({
          razorpay_payment_id: payload.id,
          razorpay_order_id: payload.order_id,
          error_code: payload.error_code,
          error_description: payload.error_description,
          failed_at: new Date(payload.createdAt * 1000).toISOString(),
          webhook_event: event,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`❌ Payment failed: ${payload.id}`);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});