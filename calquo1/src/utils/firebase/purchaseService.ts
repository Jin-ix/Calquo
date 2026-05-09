import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  orderBy,
  getDocs,
  deleteDoc,
  or
} from 'firebase/firestore';
import { firebaseDb } from './config';
import { PurchaseRequest, PurchaseRequestStatus, FinancialPaymentRequest } from '../../types/purchaseTypes';

const PURCHASE_REQUESTS_COLLECTION = 'purchase_requests';
const FINANCIAL_REQUESTS_COLLECTION = 'financial_payment_requests';
const ORDERS_COLLECTION = 'orders';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- MOCK STORAGE FOR DEMO/FALLBACK ---
// Used when Firestore is not configured or fails
const MOCK_STORAGE_KEY = 'calico_mock_requests';

const getMockRequests = (): PurchaseRequest[] => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
  } catch (e) { return []; }
};

const saveMockRequests = (requests: PurchaseRequest[]) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(requests));
};

const mockListeners: Map<string, (requests: PurchaseRequest[]) => void> = new Map();

const notifyMockListeners = () => {
  const requests = getMockRequests();
  mockListeners.forEach(callback => callback(requests));
};

// --- END MOCK STORAGE ---

// Helper to send notification
const sendNotification = async (
  recipientId: string, 
  role: string, 
  title: string, 
  message: string, 
  type: string,
  data?: any
) => {
  if (!firebaseDb) {
    console.log(`[Mock Notification] To: ${recipientId} (${role}) - ${title}: ${message}`);
    return;
  }

  try {
    // notifications schema: id, user_id (uuid FK → companies.id), content, is_read, read_at, created_at
    await addDoc(collection(firebaseDb, NOTIFICATIONS_COLLECTION), {
      user_id:    recipientId,
      content:    `${title}: ${message}`,   // schema has single 'content' column
      is_read:    false,
      created_at: new Date().toISOString(),
      // Extra fields stored but not schema columns — harmless as jsonb-style extras
      title,
      message,
      type,
      data,
      recipientRole: role,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const purchaseService = {
  // Create a new purchase request
  createRequest: async (requestData: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseDb) {
      console.warn('Firestore not available, using mock storage for createRequest');
      const requests = getMockRequests();
      const newRequest: PurchaseRequest = {
        ...requestData,
        id: 'mock_req_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      requests.push(newRequest);
      saveMockRequests(requests);
      notifyMockListeners();
      return newRequest.id;
    }

    try {
      const docRef = await addDoc(collection(firebaseDb, PURCHASE_REQUESTS_COLLECTION), {
        ...requestData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Notify Seller
      const sellerId = requestData.sellerId;
      if (sellerId) {
        await sendNotification(
          sellerId,
          'seller',
          '🛍️ New Purchase Request',
          `New request from ${requestData.buyerCompany || requestData.buyerName} for ${requestData.stockName}`,
          'purchase_request_received',
          { requestId: docRef.id }
        );
      }

      // Notify Logistics Agent
      const logisticsAgentId = requestData.logisticsAgentId;
      if (logisticsAgentId) {
        await sendNotification(
          logisticsAgentId,
          'logistics',
          '🚚 New Delivery Request',
          `You've been assigned to deliver ${requestData.stockName} from ${requestData.sellerCompany || requestData.sellerName} to ${requestData.buyerCompany || requestData.buyerName}`,
          'logistics_request_received',
          { requestId: docRef.id }
        );
      }

      // Notify Financial Agent (if payment mode is 'finance')
      const financialAgentId = requestData.financialAgentId;
      if (financialAgentId && requestData.paymentMode === 'finance') {
        await sendNotification(
          financialAgentId,
          'financial',
          '💰 New Payment Request',
          `Payment request for ${requestData.buyerCompany || requestData.buyerName} - ₹${requestData.totalAmount.toLocaleString()}`,
          'financial_request_received',
          { requestId: docRef.id }
        );
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase request:', error);
      
      // Fallback to mock if Firestore fails (e.g. permission error)
      const requests = getMockRequests();
      const newRequest: PurchaseRequest = {
        ...requestData,
        id: 'mock_req_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      requests.push(newRequest);
      saveMockRequests(requests);
      notifyMockListeners();
      return newRequest.id;
    }
  },

  // Update request status (e.g., Acknowledge)
  updateStatus: async (requestId: string, status: PurchaseRequestStatus, additionalData?: any) => {
    if (!firebaseDb) {
      const requests = getMockRequests();
      const index = requests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        requests[index] = { ...requests[index], status, ...additionalData, updatedAt: new Date().toISOString() };
        saveMockRequests(requests);
        notifyMockListeners();
      }
      return;
    }

    try {
      const docRef = doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId);
      const docSnap = await getDoc(docRef);
      
      // If not found in Firestore, check mock
      if (!docSnap.exists()) {
         const requests = getMockRequests();
         const index = requests.findIndex(r => r.id === requestId);
         if (index !== -1) {
            requests[index] = { ...requests[index], status, ...additionalData, updatedAt: new Date().toISOString() };
            saveMockRequests(requests);
            notifyMockListeners();
            return;
         }
         throw new Error('Request not found');
      }
      
      const data = docSnap.data() as PurchaseRequest;

      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      });

      // Notify Buyer on Acknowledge
      if (status === 'seller_acknowledged') {
        await sendNotification(
          data.buyerId,
          'buyer',
          'Request Acknowledged',
          `Your purchase request has been acknowledged by ${data.sellerName}`,
          'request_acknowledged',
          { requestId }
        );
      } else if (status === 'rejected') {
        // Notify Buyer on Rejection
        await sendNotification(
          data.buyerId,
          'buyer',
          'Request Rejected',
          `Your purchase request for ${data.stockName} was rejected by ${data.sellerName || 'the seller'}.`,
          'request_rejected',
          { requestId }
        );
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  // Update request with any fields
  updateRequest: async (requestId: string, data: Partial<PurchaseRequest>) => {
    if (!firebaseDb) {
        const requests = getMockRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index] = { ...requests[index], ...data, updatedAt: new Date().toISOString() };
            saveMockRequests(requests);
            notifyMockListeners();
        }
        return;
    }
    
    try {
        const docRef = doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId);
        const docSnap = await getDoc(docRef);
        
        // Mock fallback
        if (!docSnap.exists()) {
             const requests = getMockRequests();
             const index = requests.findIndex(r => r.id === requestId);
             if (index !== -1) {
                requests[index] = { ...requests[index], ...data, updatedAt: new Date().toISOString() };
                saveMockRequests(requests);
                notifyMockListeners();
                return;
             }
        }

        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating request:', error);
        throw error;
    }
  },

  // Assign financial agent
  assignAgent: async (requestId: string, agentId: string, agentName: string) => {
    if (!firebaseDb) {
        const requests = getMockRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                status: 'pending_agent',
                financialAgentId: agentId,
                financialAgentName: agentName,
                updatedAt: new Date().toISOString() 
            };
            saveMockRequests(requests);
            notifyMockListeners();
        }
        return;
    }

    try {
      // Update purchase request
      const docRef = doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId);
      const docSnap = await getDoc(docRef);
      
      // Mock fallback
      if (!docSnap.exists()) {
         const requests = getMockRequests();
         const index = requests.findIndex(r => r.id === requestId);
         if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                status: 'pending_agent',
                financialAgentId: agentId,
                financialAgentName: agentName,
                updatedAt: new Date().toISOString() 
            };
            saveMockRequests(requests);
            notifyMockListeners();
            return;
         }
         throw new Error('Request not found');
      }
      
      const data = docSnap.data() as PurchaseRequest;

      await updateDoc(docRef, {
        status: 'pending_agent',
        financialAgentId: agentId,
        financialAgentName: agentName,
        updatedAt: new Date().toISOString()
      });

      // Create financial payment request
      await addDoc(collection(firebaseDb, FINANCIAL_REQUESTS_COLLECTION), {
        purchaseRequestId: requestId,
        amount: data.totalAmount,
        agentId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        stockName: data.stockName, // Useful for display
        buyerCompany: data.buyerCompany,
        sellerCompany: data.sellerCompany,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Notify Agent
      await sendNotification(
        agentId,
        'financial',
        'New Payment Request',
        `Payment request for ${data.buyerCompany}`,
        'payment_request_received',
        { requestId }
      );

    } catch (error) {
      console.error('Error assigning agent:', error);
      throw error;
    }
  },

  // Complete payment (by Agent or Direct)
  completePayment: async (requestId: string, transactionId: string, paymentMethod: 'agent' | 'direct') => {
    if (!firebaseDb) {
        const requests = getMockRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                status: 'paid',
                updatedAt: new Date().toISOString() 
            };
            saveMockRequests(requests);
            notifyMockListeners();
        }
        return true;
    }

    try {
      const requestRef = doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      // Mock fallback
      if (!requestSnap.exists()) {
         const requests = getMockRequests();
         const index = requests.findIndex(r => r.id === requestId);
         if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                status: 'paid',
                updatedAt: new Date().toISOString() 
            };
            saveMockRequests(requests);
            notifyMockListeners();
            return true;
         }
         throw new Error('Request not found');
      }
      
      const requestData = requestSnap.data() as PurchaseRequest;

      // Update purchase request status
      await updateDoc(requestRef, {
        status: 'paid',
        updatedAt: new Date().toISOString()
      });

      // If paid by agent, update financial request
      if (paymentMethod === 'agent' && requestData.financialAgentId) {
        const finQuery = query(
          collection(firebaseDb, FINANCIAL_REQUESTS_COLLECTION), 
          where('purchaseRequestId', '==', requestId),
          where('agentId', '==', requestData.financialAgentId),
          where('status', '==', 'pending')
        );
        
        const finDocs = await getDocs(finQuery);
        finDocs.forEach(async (d) => {
          await updateDoc(d.ref, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            transactionId
          });
        });
      }

      // Create Order
      const orderRef = await addDoc(collection(firebaseDb, ORDERS_COLLECTION), {
        ...requestData,
        orderDate: new Date().toISOString(),
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        transactionId,
        status: 'confirmed' // Initial order status
      });

      // Notify Buyer
      await sendNotification(
        requestData.buyerId,
        'buyer',
        'Order Confirmed',
        `Payment successful. Order confirmed for ${requestData.stockName}`,
        'order_confirmed',
        { orderId: orderRef.id }
      );

      // Notify Seller
      await sendNotification(
        requestData.sellerId,
        'seller',
        'Order Confirmed',
        `Payment received. Order confirmed for ${requestData.stockName}`,
        'order_confirmed',
        { orderId: orderRef.id }
      );

      // Notify Agent if involved
      if (paymentMethod === 'agent' && requestData.financialAgentId) {
        await sendNotification(
          requestData.financialAgentId,
          'financial',
          'Payment Successful',
          `Payment processed successfully for ${requestData.stockName}`,
          'payment_success',
          { orderId: orderRef.id }
        );
      }

      return true;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  // Mark request as paid (used when order is created via BuyNowFlow)
  markRequestPaid: async (requestId: string, orderId: string) => {
    if (!firebaseDb) { return; }
    try {
      const requestRef = doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      // Mock fallback
      if (!requestSnap.exists()) {
        const requests = getMockRequests();
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                status: 'paid',
                linkedOrderId: orderId,
                updatedAt: new Date().toISOString()
            };
            saveMockRequests(requests);
            notifyMockListeners();
        }
        return;
      }

      const requestData = requestSnap.data() as PurchaseRequest;

      await updateDoc(requestRef, {
        status: 'paid',
        linkedOrderId: orderId,
        updatedAt: new Date().toISOString()
      });

      // Notify Buyer
      await sendNotification(
        requestData.buyerId,
        'buyer',
        'Order Confirmed',
        `Order placed successfully. Order ID: ${orderId}`,
        'order_confirmed',
        { orderId }
      );

      // Notify Seller
      await sendNotification(
        requestData.sellerId,
        'seller',
        'Order Confirmed',
        `New order received from ${requestData.buyerCompany}. Order ID: ${orderId}`,
        'order_confirmed',
        { orderId }
      );

    } catch (error) {
      console.error('Error marking request as paid:', error);
      throw error;
    }
  },

  // Listen to requests for a user (Buyer or Seller)
  subscribeToRequests: (
    userId: string, 
    role: 'buyer' | 'seller' | 'financial', 
    callback: (requests: PurchaseRequest[]) => void
  ) => {
    
    // Helper to filter mock requests
    const getFilteredMockRequests = () => {
        return getMockRequests().filter(r => {
            if (role === 'buyer') return r.buyerId === userId;
            if (role === 'seller') return r.sellerId === userId;
            if (role === 'financial') return r.financialAgentId === userId;
            return false;
        });
    };

    // If no Firestore, just use mock listener
    if (!firebaseDb) {
        console.warn('Firestore not available, using mock storage for subscription');
        const filterAndCallback = () => {
            const filtered = getFilteredMockRequests();
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(filtered);
        };

        // Initial call
        filterAndCallback();

        // Subscribe
        const listenerId = Math.random().toString();
        mockListeners.set(listenerId, filterAndCallback);
        return () => mockListeners.delete(listenerId);
    }

    // If Firestore is available, we need to combine both sources
    // We'll keep local state for both and merge them whenever either changes
    let firestoreRequests: PurchaseRequest[] = [];
    let mockRequests: PurchaseRequest[] = getFilteredMockRequests();

    const mergeAndCallback = () => {
        const allRequests = [...firestoreRequests, ...mockRequests];
        
        const requestMap = new Map<string, PurchaseRequest>();
        
        allRequests.forEach(req => {
            const existing = requestMap.get(req.id);
            if (!existing) {
                requestMap.set(req.id, req);
            } else {
                // If duplicate, use the one with newer updatedAt
                const existingTime = new Date(existing.updatedAt).getTime();
                const newTime = new Date(req.updatedAt).getTime();
                if (newTime > existingTime) {
                    requestMap.set(req.id, req);
                }
            }
        });

        const merged = Array.from(requestMap.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(merged);
    };

    // 1. Setup Firestore Listener
    let unsubFirestore = () => {};
    try {
        let q;
        const collectionRef = collection(firebaseDb, PURCHASE_REQUESTS_COLLECTION);

        if (role === 'buyer') {
          console.log("QUERYING WITH buyer_id:", userId);
          q = query(
            collectionRef, 
            where('buyer_id', '==', userId)
          );
        } else if (role === 'seller') {
          console.log("QUERYING WITH seller_id:", userId);
          q = query(
            collectionRef, 
            where('seller_id', '==', userId)
          );
        } else if (role === 'financial') {
          console.log("QUERYING WITH financial_agent_id:", userId);
          q = query(collectionRef, where('financial_agent_id', '==', userId));
        }

        if (q) {
            unsubFirestore = onSnapshot(q, (snapshot) => {
              firestoreRequests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as PurchaseRequest[];
              console.log(`Firestore subscription update (${role}): ${firestoreRequests.length} requests found`);
              mergeAndCallback();
            }, (error) => {
                console.error("Firestore subscription error:", error);
            });
        }
    } catch (e) {
        console.error("Error setting up Firestore subscription:", e);
    }

    // 2. Setup Mock Listener
    const listenerId = Math.random().toString();
    const mockListener = () => {
        mockRequests = getFilteredMockRequests();
        mergeAndCallback();
    };
    mockListeners.set(listenerId, mockListener);

    // Initial merge (in case Firestore takes time or fails immediately)
    mergeAndCallback();

    // Return unsubscribe function that cleans up both
    return () => {
        unsubFirestore();
        mockListeners.delete(listenerId);
    };
  },

  // Delete a request
  deleteRequest: async (requestId: string) => {
    if (!firebaseDb) {
        const requests = getMockRequests();
        const filtered = requests.filter(r => r.id !== requestId);
        saveMockRequests(filtered);
        notifyMockListeners();
        return;
    }

    try {
      await deleteDoc(doc(firebaseDb, PURCHASE_REQUESTS_COLLECTION, requestId));
      
      // Also delete from mock if it exists there
      const requests = getMockRequests();
      if (requests.some(r => r.id === requestId)) {
          const filtered = requests.filter(r => r.id !== requestId);
          saveMockRequests(filtered);
          notifyMockListeners();
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      // If firestore fails, try deleting from mock anyway
      const requests = getMockRequests();
      const filtered = requests.filter(r => r.id !== requestId);
      saveMockRequests(filtered);
      notifyMockListeners();
    }
  }
};