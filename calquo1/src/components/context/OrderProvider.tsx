import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ReviewRating, OrderReview } from '../orders/RatingReviewDialog';
import { addDocument, updateDocument, getDocuments, listenToCollection, where, or } from '../../utils/firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { processNewOrder, updateOrderInFirestore, notifyBuyerAboutOrderStatus } from '../../utils/orderNotifications';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { PurchaseRequest } from '../../types/purchaseTypes';

// Enhanced order interfaces for the new stock system
export interface OrderRequest {
  id: string;
  stockId?: string;
  stockItemId?: string;
  stockName?: string;
  itemName: string;
  itemId?: string;
  quantity: number;
  unitPrice: number;
  pricePerUnit?: number;
  totalAmount: number;
  buyerCompany: string;
  buyerEmail?: string;
  supplierName: string;
  supplierId?: string;
  orderDate: string;
  status: 'request_sent' | 'accepted' | 'confirmed' | 'processed' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'payment_required' | 'completed' | 'failed';
  paymentMethod: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  preferredLogisticsAgent?: string;
  specialInstructions?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  deliveryTime?: string;
  category?: string;
  rejectionReason?: string;
  stockImage?: string;
  acceptanceDate?: string;
  confirmationDate?: string;
  needsPaymentConfirmation?: boolean;
  buyerName?: string;
  buyerPhone?: string;
  supplierLocation?: string;
  adminRemarks?: string;
  adminUpdatedDate?: string;

  // Enhanced stock system properties
  itemSetType?: 'set_of_pattern' | 'set_of_sizes' | 'flexible';
  selectedCombinations?: Array<{
    combinationId: string;
    colorId?: string;
    sizeId?: string;
    quantity: number;
    pricePerUnit: number;
  }>;
}

// MyOrdersView format
export interface MyOrder {
  id: string;
  itemName: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplierName: string;
  supplierId: string;
  orderDate: string;
  status: 'request_sent' | 'accepted' | 'confirmed' | 'processed' | 'shipped' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'payment_required' | 'paid' | 'failed';
  deliveryAddress: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  paymentMethod: string;
  specialInstructions?: string;
  deliveryTime?: string;
  category?: string;
  rejectionReason?: string;
  acceptanceDate?: string;
  confirmationDate?: string;
  needsPaymentConfirmation?: boolean;
}

interface OrderContextType {
  orders: OrderRequest[];
  reviews: OrderReview[];
  addOrder: (orderData: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>) => OrderRequest;
  updateOrderStatus: (orderId: string, status: OrderRequest['status'], additionalData?: Partial<OrderRequest>) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: OrderRequest['paymentStatus']) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  confirmAndPay: (orderId: string, paymentMethod: string) => void;
  cancelOrder: (orderId: string) => void;
  getMyOrders: (userCompany: string) => MyOrder[];
  getOrderById: (orderId: string) => OrderRequest | undefined;
  getOrdersForSupplier: (supplierName: string) => OrderRequest[];
  deleteOrder: (orderId: string) => void;
  clearOrders: () => void;
  // Review management
  submitReview: (reviewData: {
    orderId: string;
    productRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
    supplierRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
  }) => void;
  getOrderReview: (orderId: string) => OrderReview | undefined;
  canEditReview: (orderId: string) => boolean;
  incomingOrderCount: number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: React.ReactNode;
  initialOrders?: OrderRequest[];
}

export function OrderProvider({ children, initialOrders = [] }: OrderProviderProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRequest[]>(initialOrders);
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [incomingOrderCount, setIncomingOrderCount] = useState(0);

  // Subscribe to incoming requests for notification badge
  useEffect(() => {
    console.log("Starting listener");
    if (!user?.id) return;

    let unsubscribe = () => { };

    // Determine role for subscription
    let subscriptionRole: 'seller' | 'financial' | null = null;
    if (user.role === 'financial') {
      subscriptionRole = 'financial';
    } else if (['manufacturer', 'retailer', 'trader', 'warehouse'].includes(user.role)) {
      subscriptionRole = 'seller';
    }

    if (subscriptionRole) {
      console.log('[OrderProvider] Subscribing to requests for badge count, role:', subscriptionRole);
      if (subscriptionRole === 'seller') console.log("QUERYING WITH sellerId:", user.id);
      if (subscriptionRole === 'financial') console.log("QUERYING WITH financialAgentId:", user.id);

      unsubscribe = purchaseService.subscribeToRequests(user.id, subscriptionRole, (requests) => {
        // Count unread requests (pending_seller_ack)
        const unread = requests.filter(r => r.status === 'pending_seller_ack').length;
        setIncomingOrderCount(unread);
      });
    }

    return () => {
      console.log("Stopping listener");
      unsubscribe();
    };
  }, [user]);

  // Listen for orders from Firestore (Admin Only for now)
  useEffect(() => {
    if (!user) return;

    // Only sync for Admin users to ensure Admin Dashboard has data
    // Non-admin users will rely on local state or separate implementation
    if (user.role !== 'admin' && !user.email?.includes('admin')) {
      return;
    }

    console.log('[OrderProvider] Setting up real-time order sync for Admin:', user.id);

    // No constraints = get all orders
    const unsubscribe = listenToCollection('orders', [], (data) => {
      console.log(`[OrderProvider] Synced ${data.length} orders from Firestore`);

      const syncedOrders = data.map((doc: any) => {
        // Helper to convert Timestamp to ISO string
        const toISO = (val: any) => val?.toDate?.()?.toISOString() || val;

        return {
          ...doc,
          id: doc.id,
          orderDate: toISO(doc.orderDate),
          acceptanceDate: toISO(doc.acceptanceDate),
          confirmationDate: toISO(doc.confirmationDate),
          deliveryTime: toISO(doc.deliveryTime),
          estimatedDelivery: toISO(doc.estimatedDelivery)
        } as OrderRequest;
      });

      // Sort by date desc
      syncedOrders.sort((a, b) => {
        const dateA = new Date(a.orderDate || 0).getTime();
        const dateB = new Date(b.orderDate || 0).getTime();
        return dateB - dateA;
      });

      setOrders(syncedOrders);
    }, (error) => {
      console.error('[OrderProvider] Error syncing orders:', error);
      // Don't show toast on every error to avoid spamming if permission denied
    });

    return () => {
      console.log('[OrderProvider] Unsubscribing from orders');
      unsubscribe();
    };
  }, [user]);

  // Add new order and return the created order
  const addOrder = useCallback((orderData: Omit<OrderRequest, 'id' | 'orderDate' | 'status' | 'paymentStatus'>): OrderRequest => {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    const newOrder: OrderRequest = {
      ...orderData,
      id: orderNumber,
      orderDate: new Date().toISOString(),
      status: 'request_sent',
      paymentStatus: 'pending'
    };

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      console.log('[OrderProvider] Order added:', newOrder.id, 'Total orders:', updated.length);
      return updated;
    });

    // Success notification
    toast.success(`Order ${orderNumber} placed successfully!`);

    // Process new order
    processNewOrder(newOrder);

    return newOrder;
  }, []);

  // Update order status
  const updateOrderStatus = useCallback((orderId: string, status: OrderRequest['status'], additionalData?: Partial<OrderRequest>) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status, ...additionalData };

        // Update order in Firestore
        updateOrderInFirestore(orderId, { status, ...additionalData });

        // Notify buyer about order status change
        notifyBuyerAboutOrderStatus(updatedOrder, status, additionalData?.rejectionReason);

        return updatedOrder;
      }
      return order;
    }));
    console.log('[OrderProvider] Order status updated:', orderId, 'to', status);
  }, []);

  // Update payment status
  const updatePaymentStatus = useCallback((orderId: string, paymentStatus: OrderRequest['paymentStatus']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, paymentStatus }
        : order
    ));
    console.log('[OrderProvider] Payment status updated:', orderId, 'to', paymentStatus);

    // Update order in Firestore
    updateOrderInFirestore(orderId, { paymentStatus });
  }, []);

  // Accept order (supplier action)
  const acceptOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? {
          ...order,
          status: 'accepted',
          paymentStatus: 'payment_required',
          acceptanceDate: new Date().toISOString(),
          needsPaymentConfirmation: true
        }
        : order
    ));
    console.log('[OrderProvider] Order accepted:', orderId);
    toast.success('Order accepted! Awaiting retailer confirmation and payment.');
  }, []);

  // Reject order (supplier action)
  const rejectOrder = useCallback((orderId: string, reason: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'rejected', rejectionReason: reason }
        : order
    ));
    console.log('[OrderProvider] Order rejected:', orderId, 'Reason:', reason);
    toast.error('Order rejected by supplier.');
  }, []);

  // Confirm and pay (retailer action)
  const confirmAndPay = useCallback((orderId: string, paymentMethod: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? {
          ...order,
          status: 'confirmed',
          paymentStatus: 'completed',
          paymentMethod,
          confirmationDate: new Date().toISOString(),
          needsPaymentConfirmation: false
        }
        : order
    ));
    console.log('[OrderProvider] Order confirmed and paid:', orderId);
    toast.success('Payment successful! Your order has been confirmed and is now being processed.');
  }, []);

  // Cancel order (retailer action)
  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'cancelled' }
        : order
    ));
    console.log('[OrderProvider] Order cancelled:', orderId);
    toast.success('Order cancelled successfully.');
  }, []);

  // Convert OrderRequest format to MyOrder format for MyOrdersView
  const convertToMyOrderFormat = useCallback((orderRequests: OrderRequest[]): MyOrder[] => {
    return orderRequests.map(order => ({
      id: order.id,
      itemName: order.stockName || order.itemName || 'Unknown Item',
      itemId: order.stockId || order.stockItemId || order.itemId || order.id,
      quantity: order.quantity,
      unitPrice: order.pricePerUnit || order.unitPrice || 0,
      totalAmount: order.totalAmount,
      supplierName: order.supplierName || 'Unknown Supplier',
      supplierId: order.supplierId || 'unknown',
      orderDate: order.orderDate,
      status: order.status, // Keep the same status mapping
      paymentStatus: order.paymentStatus === 'completed' ? 'paid' as const :
        order.paymentStatus === 'payment_required' ? 'payment_required' as const :
          order.paymentStatus === 'failed' ? 'failed' as const :
            'pending' as const,
      deliveryAddress: order.deliveryAddress || '',
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber,
      paymentMethod: order.paymentMethod || 'unknown',
      specialInstructions: order.specialInstructions,
      deliveryTime: order.deliveryTime,
      category: order.category,
      rejectionReason: order.rejectionReason,
      acceptanceDate: order.acceptanceDate,
      confirmationDate: order.confirmationDate,
      needsPaymentConfirmation: order.needsPaymentConfirmation
    }));
  }, []);

  // Get orders for a specific user (buyer)
  const getMyOrders = useCallback((userCompany: string): MyOrder[] => {
    const userOrders = orders.filter(order => order.buyerCompany === userCompany);
    const convertedOrders = convertToMyOrderFormat(userOrders);
    console.log('[OrderProvider] Getting orders for user:', userCompany, 'Found:', convertedOrders.length);
    return convertedOrders;
  }, [orders, convertToMyOrderFormat]);

  // Get single order by ID
  const getOrderById = useCallback((orderId: string): OrderRequest | undefined => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  // Get orders for a specific supplier
  const getOrdersForSupplier = useCallback((supplierName: string): OrderRequest[] => {
    return orders.filter(order => order.supplierName === supplierName);
  }, [orders]);

  // Delete order
  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    console.log('[OrderProvider] Order deleted:', orderId);
  }, []);

  // Clear all orders
  const clearOrders = useCallback(() => {
    setOrders([]);
    console.log('[OrderProvider] All orders cleared');
  }, []);

  // Submit review for an order
  const submitReview = useCallback((reviewData: {
    orderId: string;
    productRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
    supplierRating?: Omit<ReviewRating, 'id' | 'createdDate'>;
  }) => {
    const now = new Date().toISOString();

    // Create the complete review object
    const orderReview: OrderReview = {
      orderId: reviewData.orderId,
      submittedDate: now,
      canEdit: true
    };

    // Add product rating if provided
    if (reviewData.productRating) {
      orderReview.productRating = {
        ...reviewData.productRating,
        id: `${reviewData.orderId}-product-${Date.now()}`,
        createdDate: now
      };
    }

    // Add supplier rating if provided
    if (reviewData.supplierRating) {
      orderReview.supplierRating = {
        ...reviewData.supplierRating,
        id: `${reviewData.orderId}-supplier-${Date.now()}`,
        createdDate: now
      };
    }

    // Update or add the review
    setReviews(prev => {
      const existingIndex = prev.findIndex(review => review.orderId === reviewData.orderId);
      if (existingIndex >= 0) {
        // Update existing review
        const updated = [...prev];
        updated[existingIndex] = { ...orderReview, submittedDate: prev[existingIndex].submittedDate };
        return updated;
      } else {
        // Add new review
        return [...prev, orderReview];
      }
    });

    console.log('[OrderProvider] Review submitted for order:', reviewData.orderId);
  }, []);

  // Get review for a specific order
  const getOrderReview = useCallback((orderId: string): OrderReview | undefined => {
    const review = reviews.find(r => r.orderId === orderId);
    if (review) {
      // Check if still editable (within 7 days)
      const submittedDate = new Date(review.submittedDate);
      const currentDate = new Date();
      const daysDifference = Math.floor((currentDate.getTime() - submittedDate.getTime()) / (1000 * 3600 * 24));
      return {
        ...review,
        canEdit: daysDifference <= 7
      };
    }
    return undefined;
  }, [reviews]);

  // Check if review can be edited
  const canEditReview = useCallback((orderId: string): boolean => {
    const review = getOrderReview(orderId);
    return review?.canEdit ?? false;
  }, [getOrderReview]);

  // Debug logging
  useEffect(() => {
    console.log('[OrderProvider] Orders state updated. Total orders:', orders.length);
    console.log('[OrderProvider] Reviews state updated. Total reviews:', reviews.length);
  }, [orders, reviews]);

  const contextValue: OrderContextType = {
    orders,
    reviews,
    addOrder,
    updateOrderStatus,
    updatePaymentStatus,
    acceptOrder,
    rejectOrder,
    confirmAndPay,
    cancelOrder,
    getMyOrders,
    getOrderById,
    getOrdersForSupplier,
    deleteOrder,
    clearOrders,
    submitReview,
    getOrderReview,
    canEditReview,
    incomingOrderCount
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

// Helper hook for real-time order updates
export function useOrderRealTime(userCompany: string) {
  const { getMyOrders } = useOrders();
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);

  useEffect(() => {
    const updateMyOrders = () => {
      const orders = getMyOrders(userCompany);
      setMyOrders(orders);
    };

    updateMyOrders();

    // Set up interval to check for updates (can be replaced with WebSocket in production)
    const interval = setInterval(updateMyOrders, 1000);

    return () => clearInterval(interval);
  }, [getMyOrders, userCompany]);

  return myOrders;
}
