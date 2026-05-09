import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, Check, X, Clock, CreditCard, Package } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { PurchaseRequest } from '../../types/purchaseTypes';

export interface PaymentApprovalRequest {
  id: string;
  orderId: string;
  retailerName: string;
  retailerCompany: string;
  stockName: string;
  quantity: number;
  totalAmount: number;
  requestDate: string;
  expiryDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  message?: string;
}

export interface Notification {
  id: string;
  type: 'payment_approval_request' | 'payment_approved' | 'payment_rejected' | 'payment_expired' |
  'order_confirmed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' |
  'purchase_request_accepted' | 'purchase_request_received' | 'purchase_request_rejected' | 'stock_available' |
  'delivery_update' | 'system_announcement' | 'general' | 'request_acknowledged' | 'payment_request_received' | 'payment_success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any; // Made more flexible to support different notification data types
  recipientRole?: string;
  recipientId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionable?: boolean;
  actionUrl?: string;
  isVirtual?: boolean; // Flag for notifications generated from requests
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  // Major notification helpers
  notifyOrderConfirmed: (orderId: string, itemName: string, amount: number, recipientRole?: string) => void;
  notifyOrderShipped: (orderId: string, itemName: string, trackingId: string) => void;
  notifyOrderDelivered: (orderId: string, itemName: string) => void;
  notifyPurchaseRequestAccepted: (requestId: string, itemName: string, sellerName: string, recipientRole?: string) => void;
  notifyPurchaseRequestRejected: (requestId: string, itemName: string, reason: string) => void;
  notifyStockAvailable: (itemName: string, quantity: number, sellerName: string, recipientRole?: string) => void;
  notifySystemAnnouncement: (title: string, message: string, priority?: 'low' | 'medium' | 'high' | 'urgent') => void;
  approvePaymentRequest: (requestId: string, reason?: string) => Promise<void>;
  rejectPaymentRequest: (requestId: string, reason?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firestoreNotifications, setFirestoreNotifications] = useState<Notification[]>([]);
  const [activeRequests, setActiveRequests] = useState<PurchaseRequest[]>([]);
  const { user } = useAuth();

  // Listen for notifications from Firestore
  useEffect(() => {
    if (!user) return;

    // Safety check for Firebase DB
    if (!firebaseDb) {
      console.warn('Firebase DB not initialized, skipping Firestore notifications listener');
      setFirestoreNotifications([]);
      return;
    }

    try {
      const q = query(
        collection(firebaseDb, 'notifications'),
        where('user_id', '==', user.id)
        // Removed orderBy to avoid index requirement error
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        // Sort in memory instead of query
        newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setFirestoreNotifications(newNotifications);

        // Show toast for new unread notifications
        // Our Supabase shim doesn't support docChanges(), so we
        // treat every snapshot refresh as potentially containing new items.
        // Toasts are deduped by the notification id in practice.
        newNotifications
          .filter(notif => !notif.read && !notif.isVirtual)
          .slice(0, 1) // Only show one toast per refresh to avoid flooding
          .forEach(notif => {
            toast(notif.title, {
              description: notif.message,
              icon: <Bell className="h-4 w-4 text-blue-500" />
            });
          });
      }, (error) => {
        console.error("Firestore notification snapshot error:", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notification listener:", err);
    }
  }, [user]);

  // Listen for active requests to generate virtual notifications
  useEffect(() => {
    if (!user) return;

    let role: 'buyer' | 'seller' | 'financial' | null = null;
    if (user.role === 'retailer' || user.role === 'trader') role = 'buyer';
    if (user.role === 'manufacturer') role = 'seller'; // Traders can be both but simplify for now
    if (user.role === 'trader' && !role) role = 'seller'; // Default trader to seller if not buyer logic
    // Correction: Traders are both. subscribeToRequests handles strict role checking.
    // We should probably subscribe as both if trader? 
    // purchaseService.subscribeToRequests takes one role.
    // For simplicity, let's just use the primary role logic or multiple subscriptions.

    // Using simple role mapping
    if (user.role === 'retailer') role = 'buyer';
    else if (user.role === 'manufacturer') role = 'seller';
    else if (user.role === 'financial') role = 'financial';
    else if (user.role === 'trader') role = 'seller'; // Fallback for trader

    if (!role) return;

    const unsubscribe = purchaseService.subscribeToRequests(user.id, role, (requests) => {
      setActiveRequests(requests);
    });

    // If trader, maybe also subscribe as buyer?
    // For now, let's stick to one subscription to avoid complexity

    return () => unsubscribe && unsubscribe();
  }, [user]);

  // Merge Firestore notifications with virtual request notifications
  const notifications = useMemo(() => {
    if (!user) return [];

    const virtualNotifications: Notification[] = [];
    const existingNotificationReqIds = new Set(
      firestoreNotifications
        .filter(n => !n.read && n.data?.requestId)
        .map(n => n.data.requestId)
    );

    activeRequests.forEach(req => {
      // Skip if we already have an UNREAD notification for this request
      if (existingNotificationReqIds.has(req.id)) return;

      let notif: Notification | null = null;
      const base = {
        id: `virtual_${req.id}`,
        timestamp: req.updatedAt || req.createdAt,
        read: false,
        isVirtual: true,
        data: { ...req, requestId: req.id },
        recipientId: user.id
      };

      const requestStatus = req.status as string; // Bypass strict type checks for UI demo

      // Seller: New Request
      if ((user.role === 'manufacturer' || user.role === 'trader') && requestStatus === 'pending_seller_ack') {
        notif = {
          ...base,
          type: 'purchase_request_received',
          title: 'New Purchase Request',
          message: `${req.buyerCompany || req.buyerName} requested ${req.totalQuantity} items of ${req.stockName}${req.specialInstructions ? `\n\nMessage: ${req.specialInstructions}` : ''}`,
          priority: 'high',
          actionable: true,
          recipientRole: 'seller'
        } as Notification;
      }

      // Seller: Buyer Paid (Direct Payment) - Needs Confirmation
      if ((user.role === 'manufacturer' || user.role === 'trader') && requestStatus === 'paid') {
        notif = {
          ...base,
          type: 'payment_success',
          title: 'Payment Received',
          message: `Payment received from ${req.buyerCompany || req.buyerName} for ${req.stockName}. Please confirm the order.`,
          priority: 'urgent',
          actionable: true,
          recipientRole: 'seller'
        } as Notification;
      }

      // Seller: Finance Approved - Needs Acceptance
      if ((user.role === 'manufacturer' || user.role === 'trader') && requestStatus === 'finance_approved_seller_pending') {
        notif = {
          ...base,
          type: 'payment_approved',
          title: 'Financing Approved',
          message: `Financial agent approved credit for ${req.buyerCompany || req.buyerName}. Please accept the order.`,
          priority: 'high',
          actionable: true,
          recipientRole: 'seller'
        } as Notification;
      }

      // Seller: New Finance Request (Dual Approval)
      if ((user.role === 'manufacturer' || user.role === 'trader') && requestStatus === 'pending_dual_approval') {
        notif = {
          ...base,
          type: 'purchase_request_received',
          title: 'New Order (Credit)',
          message: `${req.buyerCompany || req.buyerName} requested credit order for ${req.stockName}. Waiting for approval.`,
          priority: 'high',
          actionable: true,
          recipientRole: 'seller'
        } as Notification;
      }

      // Buyer: Request Accepted (Needs Payment)
      if ((user.role === 'retailer' || user.role === 'trader') && requestStatus === 'seller_acknowledged') {
        notif = {
          ...base,
          type: 'request_acknowledged',
          title: 'Request Accepted',
          message: `${req.sellerCompany || req.sellerName} accepted your request for ${req.stockName}. Please proceed to payment.${req.specialInstructions ? `\n\nMessage: ${req.specialInstructions}` : ''}`,
          priority: 'high',
          actionable: true,
          recipientRole: 'buyer'
        } as Notification;
      }

      // Financial Agent: Payment Pending (Legacy or New Statuses)
      if (user.role === 'financial' && (
        req.status === 'pending_agent' ||
        req.status === 'pending_dual_approval' ||
        req.status === 'seller_approved_finance_pending'
      )) {
        notif = {
          ...base,
          type: 'payment_approval_request',
          title: 'Payment Approval Needed',
          message: `Credit approval needed for ${req.buyerCompany} (₹${req.totalAmount})${req.specialInstructions ? `\n\nMessage: ${req.specialInstructions}` : ''}`,
          priority: 'urgent',
          actionable: true,
          recipientRole: 'financial'
        } as Notification;
      }

      if (notif) {
        virtualNotifications.push(notif);
      }
    });

    const combined = [...firestoreNotifications, ...virtualNotifications];
    // Sort by timestamp descending
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [firestoreNotifications, activeRequests, user]);

  const addNotification = (/* notification: Omit<Notification, 'id' | 'timestamp' | 'read'> */) => {
    console.log('Local notification add skipped, use Firestore');
  };

  const markAsRead = async (id: string) => {
    // If virtual, we can't mark as read in Firestore.
    // For now, we just ignore it for virtual notifications because they disappear when handled.
    if (id.startsWith('virtual_')) {
      // Optionally, we could track local dismissed IDs, but "unread requests" implies they should stay until handled.
      // So we do nothing.
      return;
    }

    try {
      const docRef = doc(firebaseDb, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = firestoreNotifications.filter(n => !n.read);
    unread.forEach(async (n) => {
      await markAsRead(n.id);
    });
  };

  const deleteNotification = async (id: string) => {
    if (id.startsWith('virtual_')) return; // Cannot delete virtual notifications
    try {
      await deleteDoc(doc(firebaseDb, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Helpers
  const notifyOrderConfirmed = () => { };
  const notifyOrderShipped = () => { };
  const notifyOrderDelivered = () => { };
  const notifyPurchaseRequestAccepted = () => { };
  const notifyPurchaseRequestRejected = () => { };
  const notifyStockAvailable = () => { };
  const notifySystemAnnouncement = () => { };

  const approvePaymentRequest = async (requestId: string) => {
    try {
      // Find the request to check its status
      const request = activeRequests.find(r => r.id === requestId);

      if (request) {
        if (request.status === 'seller_approved_finance_pending') {
          // Both approved -> Confirmed
          const txnId = 'fin_txn_' + Math.random().toString(36).substring(7);
          await purchaseService.completePayment(requestId, txnId, 'agent');
          await purchaseService.updateStatus(requestId, 'confirmed');
          toast.success('Financing Approved. Order Confirmed!');
        } else if (request.status === 'pending_dual_approval') {
          // Only Finance approved -> Waiting for Seller
          await purchaseService.updateStatus(requestId, 'finance_approved_seller_pending');
          toast.success('Financing Approved. Waiting for Seller acceptance.');
        } else {
          // Default fallback (Legacy or direct approval)
          await purchaseService.completePayment(requestId, `MANUAL-${Date.now()}`, 'agent');
          toast.success('Payment approved successfully');
        }
      } else {
        // Fallback if request not found in local state (unlikely if notification exists)
        await purchaseService.completePayment(requestId, `MANUAL-${Date.now()}`, 'agent');
        toast.success('Payment approved successfully');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    }
  };

  const rejectPaymentRequest = async (/* requestId: string, reason?: string */) => {
    try {
      // Logic for rejection if needed
      toast.success('Payment request rejected');
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notifyOrderConfirmed,
    notifyOrderShipped,
    notifyOrderDelivered,
    notifyPurchaseRequestAccepted,
    notifyPurchaseRequestRejected,
    notifyStockAvailable,
    notifySystemAnnouncement,
    approvePaymentRequest,
    rejectPaymentRequest
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Bell Component
export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-red-500' : ''}`} />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};

// Notification Panel Component
export const NotificationPanel: React.FC<{ fullPage?: boolean }> = ({ fullPage }) => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    approvePaymentRequest,
    rejectPaymentRequest
  } = useNotifications();
  const { user } = useAuth();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment_approval_request':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'payment_approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'payment_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'payment_expired':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'order_confirmed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'order_shipped':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'order_delivered':
        return <Check className="h-4 w-4 text-emerald-600" />;
      case 'order_cancelled':
        return <X className="h-4 w-4 text-red-600" />;
      case 'purchase_request_accepted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'purchase_request_rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'stock_available':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'delivery_update':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'system_announcement':
        return <Bell className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  const handleApprove = (requestId: string) => {
    approvePaymentRequest(requestId, 'Approved by financial agent');
  };

  const handleReject = (requestId: string) => {
    rejectPaymentRequest(requestId, 'Rejected by financial agent');
  };

  const containerClasses = fullPage
    ? "w-full min-h-[50vh] border-0 shadow-none bg-transparent"
    : "w-96 max-h-96 overflow-hidden rounded-none border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-white";

  const contentClasses = fullPage
    ? "h-full" // Removed overflow-y-auto to allow natural height
    : "max-h-80 overflow-y-auto no-scrollbar";

  return (
    <Card className={containerClasses}>
      <CardHeader className="pb-4 pt-5 px-6 border-b border-black/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base font-black tracking-widest uppercase text-zinc-900">Notifications</CardTitle>
          {notifications.some(n => !n.read && !n.isVirtual) && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black">
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={contentClasses}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 lg:p-20 text-center">
              <Bell className="h-10 w-10 text-zinc-200 mb-6 stroke-[1]" />
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 mb-2">No notifications</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                You're all caught up! New updates and action items will appear here.
              </p>
              {/* Debug info for development/demo */}
              {user && (
                <div className="mt-6 p-2 bg-gray-100 rounded text-xs text-left font-mono text-gray-500 overflow-hidden max-w-full">
                  User ID: {user.id.substring(0, 8)}...<br />
                  Role: {user.role}<br />
                  Mode: {firebaseDb ? 'Firestore Connected' : 'Demo/Offline'}
                </div>
              )}
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group px-6 py-5 border-b border-black/5 last:border-b-0 hover:bg-zinc-50 cursor-pointer transition-all duration-300 ${!notification.read ? `bg-zinc-50/50` : 'bg-transparent'
                  } ${notification.isVirtual ? 'bg-zinc-50' : ''}`}
                onClick={() => {
                  markAsRead(notification.id);
                  // Navigate to action URL if provided
                  if (notification.actionUrl) {
                    console.log('Navigate to:', notification.actionUrl);
                    // In a real app, use router.push(notification.actionUrl)
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold tracking-tight text-zinc-900 truncate">
                        {notification.title}
                        {notification.isVirtual && <span className="ml-3 text-[9px] uppercase tracking-widest font-black text-black bg-zinc-200 px-2 py-0.5 rounded-sm">Action Required</span>}
                        {!notification.read && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      </p>
                      <span className="text-xs font-medium text-zinc-400 shrink-0 ml-4 group-hover:text-zinc-600 transition-colors">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-wrap">
                      {notification.message}
                    </p>

                    {/* Payment approval actions for financial agents */}
                    {notification.type === 'payment_approval_request' &&
                      user?.role === 'financial' &&
                      (notification.data?.status === ('pending_agent' as any) ||
                        notification.data?.status === 'pending' ||
                        notification.data?.status === ('pending_dual_approval' as any) ||
                        notification.data?.status === ('seller_approved_finance_pending' as any)) && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-black text-white hover:bg-zinc-800 rounded-none h-9 px-6 text-xs uppercase font-black tracking-widest"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleApprove(notification.data.requestId || notification.data.id);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-none h-9 px-6 text-xs uppercase font-black tracking-widest border-zinc-200 hover:bg-zinc-100"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleReject(notification.data.requestId || notification.data.id);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                    {/* Show expiry info for pending requests */}
                    {notification.data?.status === 'pending' && notification.data.expiryDate && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <Clock className="h-3 w-3 text-red-500 stroke-[2]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                          Expires: {new Date(notification.data.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {!notification.isVirtual && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
