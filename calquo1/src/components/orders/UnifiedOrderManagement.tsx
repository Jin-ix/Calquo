import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { reviewService } from '../../utils/firebase/reviewService';
import { notificationService } from '../../utils/firebase/notificationService';
import { approvalService } from '../../utils/firebase/approvalService';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import {
  Package, CheckCircle2, XCircle, Eye,
  CreditCard, X, Truck, Search, Clock, PackageCheck, Sparkles,
  Shield, ShieldCheck, MapPin, Zap, UserCheck, Star
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { CheckoutPayment } from './CheckoutPayment';
import { MultiStepCheckout, CheckoutData } from './MultiStepCheckout';
import { RAZORPAY_CONFIG } from '../../config/razorpay';
import { OrderFlowProgress } from './OrderFlowProgress';
import { StunningRatingDialog } from '../rating/StunningRatingDialog';

// Razorpay TypeScript declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UnifiedOrderManagementProps {
  userRole: 'supplier' | 'retailer' | 'trader' | 'financial_agent' | 'logistics_agent' | 'logistics-agent';
}

const LOGISTICS_PARTNERS = [
  { id: 'lp_1', name: 'ShipRocket', eta: '3-5 days', cost: 150 },
  { id: 'lp_2', name: 'Delhivery', eta: '2-4 days', cost: 180 },
  { id: 'lp_3', name: 'Porter', eta: '1-2 days', cost: 250 },
  { id: 'lp_4', name: 'Blue Dart', eta: '2-3 days', cost: 200 }
];

const MOCK_QC_AGENTS = [
  { id: 'qc_1', name: 'Aura Textiles QA', location: 'Mumbai, India', fee: '1.5%', rating: 4.9, reviews: 124, certified: true },
  { id: 'qc_2', name: 'Delhi Fabric Inspectors', location: 'New Delhi, India', fee: '1.2%', rating: 4.7, reviews: 89, certified: true },
  { id: 'qc_3', name: 'Global Standard QC', location: 'Surat, India', fee: '2.0%', rating: 5.0, reviews: 312, certified: true },
  { id: 'qc_4', name: 'Tirupur Quality Checkers', location: 'Tirupur, India', fee: '1.8%', rating: 4.6, reviews: 56, certified: false },
];

export function UnifiedOrderManagement({ userRole }: UnifiedOrderManagementProps) {
  const { user } = useAuth();
  // Split state for dual-query support (Legacy + New Schema)
  const [incomingNew, setIncomingNew] = useState<PurchaseRequest[]>([]);
  const [incomingLegacy, setIncomingLegacy] = useState<PurchaseRequest[]>([]);

  const [outgoingNew, setOutgoingNew] = useState<PurchaseRequest[]>([]);
  const [outgoingLegacy, setOutgoingLegacy] = useState<PurchaseRequest[]>([]);

  const [incomingRequests, setIncomingRequests] = useState<PurchaseRequest[]>([]);
  const [myOrders, setMyOrders] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Merge and Dedupe Effects with Safe Sort
  useEffect(() => {
    const merged = [...incomingNew, ...incomingLegacy];
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    unique.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    setIncomingRequests(unique);
  }, [incomingNew, incomingLegacy]);

  useEffect(() => {
    const merged = [...outgoingNew, ...outgoingLegacy];
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    unique.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    setMyOrders(unique);
  }, [outgoingNew, outgoingLegacy]);


  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'seller' | 'buyer'>('seller');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Logistics & Payment Flow State
  const [logisticsDialogOpen, setLogisticsDialogOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState<'logistics' | 'payment'>('logistics');
  const [selectedLogistics, setSelectedLogistics] = useState<string>('');

  // Agent Drawer State
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [activeNegotiationRequest, setActiveNegotiationRequest] = useState<PurchaseRequest | null>(null);

  // Rating State
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingTargetRequest, setRatingTargetRequest] = useState<PurchaseRequest | null>(null);

  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Logistics Partners from Firestore
  const [logisticsPartners, setLogisticsPartners] = useState<any[]>([]);
  const [logisticsLoading, setLogisticsLoading] = useState(false);

  // Razorpay Integration State
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Track rated orders locally to disable button after rating
  const [ratedOrderIds, setRatedOrderIds] = useState<string[]>([]);



  // Fetch existing reviews for the seller to disable buttons
  useEffect(() => {
    const fetchRatedOrders = async () => {
      if (!user?.id || viewMode !== 'seller') return;

      try {
        const reviews = await reviewService.getReviewsByReviewer(user.id);
        // Filter reviews where I am the seller rating a buyer
        const myRatedOrderIds = reviews
          .filter(r => r.reviewerRole === 'seller')
          .map(r => r.orderId);

        setRatedOrderIds(prev => {
          // Merge with existing to avoid losing state if any
          const unique = Array.from(new Set([...prev, ...myRatedOrderIds]));
          return unique;
        });
      } catch (error) {
        console.error('Failed to fetch existing ratings:', error);
      }
    };

    fetchRatedOrders();
  }, [user, viewMode]);


  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      toast.error('Payment gateway failed to load');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Razorpay Payment Handler
  const handleRazorpayPayment = async (request: PurchaseRequest) => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is still loading. Please try again.');
      return;
    }

    if (!request) {
      toast.error('Invalid order details');
      return;
    }

    setProcessingPayment(true);

    try {
      console.log('🚀 Initiating Razorpay payment for request:', request.id);

      // Calculate amount in paise (Razorpay uses smallest currency unit)
      const amountInPaise = Math.round(request.totalAmount * 100);

      // Razorpay options
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: amountInPaise,
        currency: RAZORPAY_CONFIG.currency,
        name: RAZORPAY_CONFIG.companyName,
        description: `Order Payment - ${request.stockName}`,
        image: RAZORPAY_CONFIG.logoUrl,
        order_id: '', // Will be generated from backend in production
        handler: async function (response: any) {
          console.log('✅ Payment Success:', response);

          try {
            // Update order status to paid in Firebase
            await purchaseService.updateRequest(request.id, {
              status: 'paid',
              paymentStatus: 'completed',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              paidAt: new Date().toISOString()
            });

            // Send notification to seller
            await notificationService.sendNotification({
              userId: request.sellerId,
              type: 'payment_received',
              title: 'Payment Received',
              message: `Payment of ₹${request.totalAmount.toLocaleString()} received for order ${request.stockName}`,
              orderId: request.id,
              timestamp: new Date().toISOString()
            });

            // Send notification to buyer
            await notificationService.sendNotification({
              userId: request.buyerId,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ₹${request.totalAmount.toLocaleString()} for ${request.stockName} was successful. Waiting for seller confirmation.`,
              orderId: request.id,
              timestamp: new Date().toISOString()
            });

            toast.success('Payment successful! Waiting for seller confirmation.');
            setProcessingPayment(false);
          } catch (error: any) {
            console.error('❌ Error updating order after payment:', error);
            toast.error('Payment received but failed to update order. Contact support.');
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.profile?.owner_name || user?.company || '',
          email: user?.email || '',
          contact: user?.profile?.mobile || user?.mobile || ''
        },
        notes: {
          order_id: request.id,
          buyer_id: request.buyerId,
          seller_id: request.sellerId,
          stock_name: request.stockName
        },
        theme: {
          color: RAZORPAY_CONFIG.themeColor
        },
        modal: {
          ondismiss: function () {
            console.log('⚠️ Payment cancelled by user');
            toast.info('Payment cancelled');
            setProcessingPayment(false);
          }
        }
      };

      // Create Razorpay instance and open checkout
      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('❌ Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessingPayment(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error('❌ Error initiating payment:', error);
      toast.error('Failed to initiate payment: ' + error.message);
      setProcessingPayment(false);
    }
  };

  // Fetch logistics partners from Firestore when dialog opens
  useEffect(() => {
    if (!logisticsDialogOpen) {
      console.log('Logistics dialog not open, skipping query');
      return;
    }

    if (!firebaseDb) {
      console.error('Firebase DB not initialized!');
      setLogisticsLoading(false);
      setLogisticsPartners([]);
      toast.error('Database not connected');
      return;
    }

    console.log('Starting logistics partners query...');
    setLogisticsLoading(true);

    try {
      const usersRef = collection(firebaseDb, 'users');
      console.log('Users collection reference created');

      const logisticsQuery = query(usersRef, where('role', '==', 'logistics_agent'));
      console.log('Query created for role: logistics_agent');

      const unsubscribe = onSnapshot(logisticsQuery, (snapshot) => {
        console.log('✅ Logistics query snapshot received! Documents found:', snapshot.size);

        if (snapshot.empty) {
          console.warn('⚠️ No users found with role=logistics_agent');
          setLogisticsPartners([]);
          setLogisticsLoading(false);
          return;
        }

        const partners = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing logistics partner:', doc.id, data);
          return {
            id: doc.id,
            name: data.company_name || data.owner_name || data.displayName || data.name || 'Unnamed Partner',
            state: data.state,
            mobile: data.mobile || data.mobile_number,
            tier: data.tier,
            ...data
          };
        });

        console.log('✅ Mapped logistics partners:', partners);
        setLogisticsPartners(partners);
        setLogisticsLoading(false);
      }, (error) => {
        console.error('❌ Error in logistics query snapshot:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Fallback to empty list on error
        setLogisticsPartners([]);
        setLogisticsLoading(false);
        toast.error('Failed to load logistics partners: ' + error.message);
      });

      return () => {
        console.log('Cleaning up logistics query subscription');
        unsubscribe();
      };
    } catch (error: any) {
      console.error('❌ Error setting up logistics query:', error);
      console.error('Error details:', error.message);
      setLogisticsPartners([]);
      setLogisticsLoading(false);
      toast.error('Query setup failed: ' + error.message);
    }
  }, [logisticsDialogOpen]);

  useEffect(() => {
    if (!user?.id) {
      console.log('UnifiedOrderManagement: No user ID available');
      setLoading(false);
      return;
    }

    // Fallback if Firebase is not initialized
    if (!firebaseDb) {
      console.warn('UnifiedOrderManagement: Firebase DB not available');
      setLoading(false);
      return;
    }

    console.log('🔍 UnifiedOrderManagement: Starting data fetch');
    console.log('📋 User Details:', {
      id: user.id,
      email: user.email,
      company: user.company,
      role: userRole,
      profileGst: user.profile?.gstNumber,
      fullProfile: user.profile
    });
    console.log('🔧 Firebase DB Status:', firebaseDb ? 'Connected' : 'Not connected');

    const requestsRef = collection(firebaseDb, 'purchase_requests');
    console.log('✅ Collection reference created for purchase_requests');

    // Helper for safe data mapping
    const mapDocToRequest = (doc: any): PurchaseRequest => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Safe fallbacks for display fields
        stockName: data.stockName || data.itemName || 'Unknown Item',
        totalQuantity: data.totalQuantity || data.quantity || 0,
        totalAmount: data.totalAmount || (data.price * data.quantity) || 0,
        sellerName: data.sellerName || data.supplierName || 'Unknown Supplier',
        buyerName: data.buyerName || data.clientName || 'Unknown Buyer',
        // Normalize ID fields for consistent filtering
        sellerId: data.sellerId || data.seller_id,
        buyerId: data.buyerId || data.buyer_id,
        financeAgentGst: data.financeAgentGst,
        // Normalize logistics fields (handle both lowercase and capitalized)
        logisticsPartnerId: data.logisticsPartnerId || data.LogisticsAgentId || data.logisticsAgentId,
        logisticsPartnerName: data.logisticsPartnerName || data.LogisticsAgentName || data.logisticsAgentName,
        createdAt: data.createdAt || new Date().toISOString(),
      } as PurchaseRequest;
    };

    // Add timeout to detect if Firestore is not responding
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      console.warn('⚠️ Firestore query timeout - no response after 10 seconds');
      console.warn('Possible issues: Security rules, network, or collection doesn\'t exist');
      setLoading(false);
      toast.error('Database query timed out. Please check Firestore rules.');
    }, 10000);

    // Using simple collection query to avoid index issues, filtering in memory
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      clearTimeout(timeoutId); // Clear timeout once we get data
      console.log('📦 Firestore snapshot received:', snapshot.size, 'documents');

      const allRequests = snapshot.docs.map(mapDocToRequest);

      console.log('📊 All requests mapped:', allRequests.length);

      // Log first few requests for debugging
      if (allRequests.length > 0) {
        console.log('📝 Sample request data:', {
          firstRequest: {
            id: allRequests[0].id,
            buyerId: allRequests[0].buyerId,
            sellerId: allRequests[0].sellerId,
            logisticsPartnerId: allRequests[0].logisticsPartnerId,
            financialAgentId: allRequests[0].financialAgentId,
            status: allRequests[0].status,
            buyerCompany: allRequests[0].buyerCompany,
            sellerCompany: allRequests[0].sellerCompany,
            paymentMode: allRequests[0].paymentMode
          }
        });
      }

      // === LOGISTICS AGENT FILTERING ===
      if (userRole === 'logistics_agent' || userRole === 'logistics-agent') {
        console.log('🚚 ========== LOGISTICS AGENT FILTERING ==========');
        console.log('🔑 Current User:', {
          id: user.id,
          uid: (user as any).uid,
          firebaseUid: (user as any).firebaseUid,
          gstNumber: (user as any).gstNumber || user.profile?.gstNumber,
          email: user.email,
          company: user.company,
          profileCompany: user.profile?.company
        });

        console.log('📋 All Requests with Logistics Info:');
        allRequests.forEach((r, idx) => {
          console.log(`  [${idx + 1}] ${r.id.substring(0, 10)}...`, {
            logisticsPartnerId: r.logisticsPartnerId || 'NOT SET',
            logisticsPartnerName: r.logisticsPartnerName || 'NOT SET',
            LogisticsAgentId: (r as any).LogisticsAgentId || 'NOT SET',
            LogisticsAgentName: (r as any).LogisticsAgentName || 'NOT SET',
            status: r.status
          });
        });

        const logistics = allRequests.filter(r => {
          // Check both lowercase and capitalized field names for compatibility
          const logisticsId = r.logisticsPartnerId || (r as any).LogisticsAgentId;
          const logisticsName = r.logisticsPartnerName || (r as any).LogisticsAgentName;

          // Check multiple ID fields (Firebase UID, custom GST ID, etc.)
          const userIds = [
            user.id,
            (user as any).uid,
            (user as any).firebaseUid,
            (user as any).gstNumber,
            user.profile?.gstNumber,
            user.email
          ].filter(Boolean);

          const matchById = userIds.some(uid => uid === logisticsId);
          const matchByCompany = (user.company && logisticsName === user.company) ||
            (user.profile?.company && logisticsName === user.profile.company);

          const match = matchById || matchByCompany;

          if (match) {
            console.log('✅ MATCH FOUND:', r.id.substring(0, 10), {
              logisticsId: logisticsId,
              logisticsName: logisticsName,
              matchedUserId: userIds.find(uid => uid === logisticsId),
              matchType: matchById ? 'ID' : 'Company'
            });
          }

          return match;
        });

        console.log('🎯 RESULT: Found', logistics.length, 'matching requests');
        console.log('🚚 ==============================================');
        setIncomingNew(logistics);
        setIncomingLegacy([]);
        setOutgoingNew([]);
        setOutgoingLegacy([]);
      }
      // === FINANCIAL AGENT FILTERING ===
      else if (userRole === 'financial_agent' || userRole === 'financial') {
        console.log('💳 Filtering for financial agent');

        const userGst = user?.profile?.gstNumber || (user as any).gstNumber || (user as any).gst_number;
        const userCompany = user.company || user.profile?.company;

        console.log('🔑 Financial Agent Details:', {
          userId: user.id,
          userEmail: user.email,
          userGst,
          userCompany
        });

        const financial = allRequests.filter(r => {
          // Only show requests that have finance payment mode
          if (r.paymentMode !== 'finance') return false;

          const matchById = r.financialAgentId === user.id;
          const matchByEmail = user.email && r.financialAgentId === user.email;
          const matchByGst = userGst && (
            r.financeAgentGst === userGst ||
            r.financialAgentGst === userGst
          );
          const matchByName = userCompany && (
            r.financialAgentName === userCompany ||
            r.financeAgentName === userCompany
          );

          const match = matchById || matchByEmail || matchByGst || matchByName;

          if (match) {
            console.log('✅ Financial match found for request:', r.id, {
              financialAgentId: r.financialAgentId,
              financialAgentName: r.financialAgentName,
              financeAgentGst: r.financeAgentGst,
              paymentMode: r.paymentMode,
              matchType: matchById ? 'ID' : matchByEmail ? 'Email' : matchByGst ? 'GST' : 'Name'
            });
          } else {
            // Debug why it didn't match
            if (r.paymentMode === 'finance') {
              console.log('❌ No match for finance request:', r.id, {
                requestFinancialAgentId: r.financialAgentId,
                requestFinanceAgentGst: r.financeAgentGst,
                requestFinancialAgentName: r.financialAgentName,
                userChecking: { id: user.id, email: user.email, gst: userGst, company: userCompany }
              });
            }
          }

          return match;
        });

        console.log('💰 Financial requests found:', financial.length);
        setIncomingNew(financial);
        setIncomingLegacy([]);
        setOutgoingNew([]);
        setOutgoingLegacy([]);
      }
      // === SELLER/BUYER FILTERING ===
      else {
        // Filter Incoming (User is Seller)
        console.log('🏭 Filtering for seller/buyer (userRole:', userRole + ')');

        const incoming = allRequests.filter(r => {
          const sid = r.sellerId;
          const userEmail = user.email;
          const userCompany = user.company;
          const userProfileCompany = user.profile?.company;

          const isSeller = sid === user.id ||
            (userEmail && sid === userEmail) ||
            (userCompany && r.sellerCompany === userCompany) ||
            (userProfileCompany && r.sellerCompany === userProfileCompany);

          if (isSeller) {
            console.log('✅ Incoming match:', r.id, 'sellerId:', sid);
          }

          return isSeller;
        });

        // Filter Outgoing (User is Buyer)
        const outgoing = allRequests.filter(r => {
          const bid = r.buyerId;
          const userEmail = user.email;
          const userCompany = user.company;
          const userProfileCompany = user.profile?.company;

          const isBuyer = bid === user.id ||
            (userEmail && bid === userEmail) ||
            (userCompany && r.buyerCompany === userCompany) ||
            (userProfileCompany && r.buyerCompany === userProfileCompany);

          if (isBuyer) {
            console.log('✅ Outgoing match:', r.id, 'buyerId:', bid);
          }

          return isBuyer;
        });

        console.log('📥 Incoming orders:', incoming.length);
        console.log('📤 Outgoing orders:', outgoing.length);

        setIncomingNew(incoming);
        setOutgoingNew(outgoing);
        setIncomingLegacy([]);
        setOutgoingLegacy([]);
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(timeoutId); // Clear timeout on error too
      console.error("❌ Firestore Stream Error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      toast.error("Failed to load orders: " + error.message);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up UnifiedOrderManagement subscriptions');
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user?.id, userRole]);

  const handleAcknowledge = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateStatus(request.id, 'seller_acknowledged');
      toast.success('Request acknowledged! Waiting for buyer to select logistics.');
    } catch (error) {
      toast.error('Failed to acknowledge request');
    }
  };

  const handleAcceptEscrowTerms = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateRequest(request.id, {
        agreed_middleman_id: request.proposed_middleman_id,
        escrow_status: 'agent_locked',
        status: 'terms_accepted'
      });
      toast.success('Escrow terms accepted! Order proceeding to payment.');
    } catch (error) {
      toast.error('Failed to accept terms');
    }
  };

  const handleDeclineEscrowEntirely = async (request: PurchaseRequest) => {
    if (confirm('Are you sure you want to decline the Independent QC request? The buyer will be notified.')) {
      try {
        await purchaseService.updateRequest(request.id, {
          status: 'terms_rejected',
          escrow_status: 'not_requested'
        });
        toast.success('Escrow request declined.');
      } catch (error) {
        toast.error('Failed to decline terms');
      }
    }
  };

  const handleCounterOfferAgent = async (request: PurchaseRequest, newAgentId: string) => {
    try {
      await purchaseService.updateRequest(request.id, {
        proposed_middleman_id: newAgentId,
        proposing_party: userRole === 'seller' ? 'seller' : 'buyer',
        escrow_status: 'negotiating_agent'
      });
      toast.success('Counter-offer sent successfully!');
      setIsAgentDrawerOpen(false);
      setActiveNegotiationRequest(null);
    } catch (error) {
      toast.error('Failed to send counter-offer');
    }
  };

  const handleReject = async (request: PurchaseRequest) => {
    if (confirm('Are you sure you want to reject this request? The order will be cancelled.')) {
      try {
        await purchaseService.updateStatus(request.id, 'rejected');
        toast.success('Order rejected.');
        if (detailsDialogOpen && selectedRequest?.id === request.id) {
          setDetailsDialogOpen(false);
        }
      } catch (error) {
        toast.error('Failed to reject request');
      }
    }
  };

  const handleViewDetails = (request: PurchaseRequest, mode: 'seller' | 'buyer') => {
    setSelectedRequest(request);
    setViewMode(mode);
    setDetailsDialogOpen(true);
  };

  // --- Logistics & Payment Flow Handlers ---

  const openCheckoutFlow = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setLogisticsDialogOpen(true);
  };

  const handleCheckoutComplete = async (data: CheckoutData) => {
    if (!selectedRequest) return;

    try {
      // Update request with all party details
      const updateData: any = {
        logisticsPartnerId: data.logisticsPartnerId,
        logisticsPartnerName: data.logisticsPartnerName,
        logisticsPartnerMobile: data.logisticsPartnerMobile,
        paymentMode: data.paymentMode,
        status: 'pending_multi_party_approval',
        allPartiesInfo: {
          buyer: {
            id: selectedRequest.buyerId,
            name: selectedRequest.buyerName,
            company: selectedRequest.buyerCompany
          },
          seller: {
            id: selectedRequest.sellerId,
            name: selectedRequest.sellerName,
            company: selectedRequest.sellerCompany
          },
          logistics: {
            id: data.logisticsPartnerId,
            name: data.logisticsPartnerName,
            mobile: data.logisticsPartnerMobile
          }
        },
        approvals: {
          seller: null,
          logistics: null,
          financial: null
        }
      };

      if (data.paymentMode === 'finance') {
        updateData.financialAgentId = data.financialAgentId;
        updateData.financialAgentGst = data.financialAgentGst;
        updateData.financialAgentName = data.financialAgentName;
        updateData.allPartiesInfo.financial = {
          id: data.financialAgentId,
          name: data.financialAgentName,
          gst: data.financialAgentGst
        };
      }

      // Update the request in Firestore
      await purchaseService.updateRequest(selectedRequest.id, updateData);

      // Send notifications to all parties
      await notificationService.notifyPurchaseRequest({
        requestId: selectedRequest.id,
        buyerId: selectedRequest.buyerId,
        buyerName: selectedRequest.buyerName,
        buyerCompany: selectedRequest.buyerCompany,
        buyerGST: selectedRequest.buyerGST,
        sellerId: selectedRequest.sellerId,
        sellerName: selectedRequest.sellerName,
        sellerCompany: selectedRequest.sellerCompany,
        logisticsPartnerId: data.logisticsPartnerId,
        logisticsPartnerName: data.logisticsPartnerName,
        financialAgentId: data.financialAgentId,
        financialAgentName: data.financialAgentName,
        itemName: selectedRequest.stockName,
        totalAmount: selectedRequest.totalAmount,
        quantity: selectedRequest.totalQuantity,
        paymentMode: data.paymentMode,
        paymentGateway: data.paymentGateway,
        items: selectedRequest.items,
        stockImage: selectedRequest.stockImage,
        specialInstructions: selectedRequest.specialInstructions
      });

      toast.success(
        `✅ Request sent! Notifications delivered to ${data.paymentMode === 'finance' ? 'seller, logistics, and financial agent' : 'seller and logistics partner'}`
      );

      setLogisticsDialogOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to submit request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_seller_ack':
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Pending Acknowledgment</Badge>;
      case 'seller_acknowledged':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Select Logistics</Badge>;

      // Multi-Party Approval Statuses
      case 'pending_multi_party_approval':
        return <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">Pending Approvals</Badge>;
      case 'logistics_rejected':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Logistics Rejected • Select Another</Badge>;

      // Finance / Dual Approval Statuses  
      case 'pending_dual_approval':
        return <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">Pending Approval (Dual)</Badge>;
      case 'finance_approved_seller_pending':
        return <Badge variant="outline" className="text-indigo-600 border-indigo-300 bg-indigo-50">Finance Approved • Waiting Seller</Badge>;
      case 'seller_approved_finance_pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Seller Accepted • Waiting Finance</Badge>;

      // Payment Statuses
      case 'awaiting_payment':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Awaiting Payment</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Paid • Waiting Confirmation</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmed & Ready</Badge>;

      // Delivery Tracking Statuses
      case 'in_transit':
        return <Badge className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"><Truck className="h-3 w-3" /> In Transit</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"><PackageCheck className="h-3 w-3" /> Delivered</Badge>;
      case 'completed':
        return <Badge className="bg-green-700 hover:bg-green-800 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;

      case 'rejected':
      case 'payment_failed':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  const handleApproveFinancing = async (request: PurchaseRequest) => {
    try {
      if (request.status === 'seller_approved_finance_pending') {
        // Both approved -> Confirmed
        const txnId = 'fin_txn_' + Math.random().toString(36).substring(7);
        await purchaseService.completePayment(request.id, txnId, 'agent');
        await purchaseService.updateStatus(request.id, 'confirmed');
        toast.success('Financing Approved. Order Confirmed!');
      } else {
        // Only Finance approved -> Waiting for Seller
        await purchaseService.updateStatus(request.id, 'finance_approved_seller_pending');
        toast.success('Financing Approved. Waiting for Seller acceptance.');
      }
    } catch (error) {
      toast.error('Failed to approve financing');
    }
  };

  const handleSellerAcceptOrder = async (request: PurchaseRequest) => {
    try {
      if (request.status === 'finance_approved_seller_pending') {
        // Both approved -> Confirmed
        await purchaseService.updateStatus(request.id, 'confirmed');
        toast.success('Order Accepted & Confirmed!');
      } else {
        // Only Seller approved -> Waiting for Finance
        await purchaseService.updateStatus(request.id, 'seller_approved_finance_pending');
        toast.success('Order Accepted. Waiting for Finance approval.');
      }
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleSellerConfirmPaidOrder = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateStatus(request.id, 'confirmed');

      // Send notification to buyer
      await notificationService.sendNotification({
        userId: request.buyerId,
        type: 'order_confirmed',
        title: '✅ Payment Confirmed',
        message: `Seller confirmed payment for ${request.stockName}. Order #${request.id.slice(0, 10)} is now ready for delivery.`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      // Send notification to logistics partner if assigned
      if (request.logisticsPartnerId) {
        await notificationService.sendNotification({
          userId: request.logisticsPartnerId,
          type: 'ready_for_delivery',
          title: '🚚 Order Ready for Delivery',
          message: `Order #${request.id.slice(0, 10)} for ${request.stockName} is confirmed and ready for pickup.`,
          orderId: request.id,
          timestamp: new Date().toISOString()
        });
      }

      toast.success('✅ Payment Confirmed! Order is ready for delivery.');
    } catch (error) {
      toast.error('Failed to confirm order');
    }
  };

  // --- DELIVERY TRACKING HANDLERS ---

  const handleSellerMarkPickedUp = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateStatus(request.id, 'in_transit' as any, {
        pickedUpAt: new Date().toISOString(),
        pickedUpBy: 'seller'
      });

      // Notify logistics partner
      if (request.logisticsPartnerId) {
        await notificationService.sendNotification({
          userId: request.logisticsPartnerId,
          type: 'ready_for_pickup',
          title: '📦 Order Ready for Pickup',
          message: `Seller has marked order #${request.id.slice(0, 10)} (${request.stockName}) as ready. Please confirm pickup.`,
          orderId: request.id,
          timestamp: new Date().toISOString()
        });
      }

      // Notify buyer
      await notificationService.sendNotification({
        userId: request.buyerId,
        type: 'order_update',
        title: '🚚 Order Picked Up',
        message: `Your order ${request.stockName} has been picked up by logistics partner.`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      toast.success('✅ Marked as picked up by logistics!');
    } catch (error) {
      console.error('Error marking picked up:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleLogisticsConfirmPickup = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateRequest(request.id, {
        logisticsPickupConfirmed: true,
        logisticsPickupConfirmedAt: new Date().toISOString()
      });

      // Notify seller
      await notificationService.sendNotification({
        userId: request.sellerId,
        type: 'pickup_confirmed',
        title: '✅ Pickup Confirmed',
        message: `Logistics partner confirmed pickup of order #${request.id.slice(0, 10)} (${request.stockName}).`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      // Notify buyer
      await notificationService.sendNotification({
        userId: request.buyerId,
        type: 'order_update',
        title: '🚚 Order In Transit',
        message: `Your order ${request.stockName} is now in transit.`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      toast.success('✅ Pickup confirmed! Order in transit.');
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast.error('Failed to confirm pickup');
    }
  };

  const handleLogisticsMarkDelivered = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateStatus(request.id, 'delivered' as any, {
        deliveredAt: new Date().toISOString(),
        deliveredBy: request.logisticsPartnerName
      });

      // Notify buyer
      await notificationService.sendNotification({
        userId: request.buyerId,
        type: 'order_delivered',
        title: '📦 Order Delivered',
        message: `Your order ${request.stockName} has been delivered! Please confirm receipt.`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      // Notify seller
      await notificationService.sendNotification({
        userId: request.sellerId,
        type: 'order_delivered',
        title: '✅ Order Delivered',
        message: `Order #${request.id.slice(0, 10)} (${request.stockName}) has been delivered to buyer.`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      toast.success('✅ Marked as delivered!');
    } catch (error) {
      console.error('Error marking delivered:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const handleBuyerConfirmReceived = async (request: PurchaseRequest) => {
    try {
      await purchaseService.updateRequest(request.id, {
        buyerConfirmedReceipt: true,
        buyerConfirmedReceiptAt: new Date().toISOString(),
        status: 'completed'
      });

      // Notify seller
      await notificationService.sendNotification({
        userId: request.sellerId,
        type: 'order_completed',
        title: '🎉 Order Completed',
        message: `Buyer confirmed receipt of order #${request.id.slice(0, 10)} (${request.stockName}). Order completed!`,
        orderId: request.id,
        timestamp: new Date().toISOString()
      });

      // Notify logistics
      if (request.logisticsPartnerId) {
        await notificationService.sendNotification({
          userId: request.logisticsPartnerId,
          type: 'order_completed',
          title: '✅ Delivery Confirmed',
          message: `Buyer confirmed receipt of order #${request.id.slice(0, 10)}.`,
          orderId: request.id,
          timestamp: new Date().toISOString()
        });
      }

      toast.success('✅ Thank you! Order marked as received.');
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error('Failed to confirm receipt');
    }
  };

  // --- NEW MULTI-PARTY APPROVAL HANDLERS ---

  const getUserRole = (): 'seller' | 'logistics' | 'financial' => {
    if (userRole === 'financial_agent' || userRole === 'financial') return 'financial';
    if (userRole === 'logistics_agent' || userRole === 'logistics-agent') return 'logistics';
    // For now, we assume sellers in this component
    return 'seller';
  };

  const handleApproveRequest = async (request: PurchaseRequest) => {
    if (!user) return;

    try {
      await approvalService.handleApprovalDecision({
        requestId: request.id,
        role: getUserRole(),
        decision: 'approved',
        userId: user.id,
        userName: user.displayName || user.company_name || 'Unknown User'
      });

      toast.success('Request approved successfully!');
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRejectRequest = async (request: PurchaseRequest) => {
    if (!user) return;

    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await approvalService.handleApprovalDecision({
        requestId: request.id,
        role: getUserRole(),
        decision: 'rejected',
        userId: user.id,
        userName: user.displayName || user.company_name || 'Unknown User',
        reason: reason || 'No reason provided'
      });

      toast.success('Request rejected');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject: ' + (error.message || 'Unknown error'));
    }
  };

  const getApprovalStatus = (request: PurchaseRequest, role: 'seller' | 'logistics' | 'financial') => {
    const approval = request.approvals?.[role];
    if (!approval) return 'pending';
    return approval.status;
  };

  const needsMyApproval = (request: PurchaseRequest): boolean => {
    if (request.status !== 'pending_multi_party_approval') return false;

    const myRole = getUserRole();
    const myApproval = getApprovalStatus(request, myRole);
    return myApproval === 'pending';
  };

  const RequestCard = ({ request, mode }: { request: PurchaseRequest, mode: 'seller' | 'buyer' }) => {
    const isUnread = mode === 'seller' && request.status === 'pending_seller_ack';

    // Actions needed logic
    const sellerNeedsAction = mode === 'seller' && (
      request.status === 'pending_seller_ack' ||
      request.status === 'pending_dual_approval' ||
      request.status === 'finance_approved_seller_pending' ||
      request.status === 'paid' ||
      request.status === 'confirmed'
    );

    const buyerNeedsAction = mode === 'buyer' && (
      request.status === 'seller_acknowledged' ||
      request.status === 'delivered'
    );

    const logisticsNeedsAction = (userRole === 'logistics_agent' || userRole === 'logistics-agent') && (
      request.status === 'in_transit'
    );

    const agentNeedsAction = userRole === 'financial_agent' && (
      request.status === 'pending_dual_approval' ||
      request.status === 'seller_approved_finance_pending'
    );

    return (
      <Card className="hover:shadow-lg transition-all">
        <CardContent className="p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Product Image */}
            {request.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={request.imageUrl}
                  alt={request.stockName || 'Product'}
                  className="w-20 h-20 object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {(sellerNeedsAction || buyerNeedsAction || logisticsNeedsAction || agentNeedsAction) && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
                <h3 className="font-semibold truncate">{request.stockName || 'Unknown Item'}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                {mode === 'seller'
                  ? `From: ${request.buyerCompany || request.buyerName}`
                  : `Supplier: ${request.sellerCompany || request.sellerName}`}
              </p>

              <p className="text-xs text-muted-foreground">
                Order #{request.id.slice(0, 10)}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-bold text-xl mb-1">₹{request.totalAmount?.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">{request.totalQuantity} items</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            {getStatusBadge(request.status)}
          </div>

          {/* Order Flow Progress */}
          <OrderFlowProgress role={userRole} order={request} />

          {/* Items Preview */}
          {request.items && request.items.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-2">Items:</p>
              <div className="space-y-1">
                {request.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-sm flex items-center justify-between">
                    <span className="text-gray-700">{item.colorId} • {item.sizeId}</span>
                    <span className="font-medium">×{item.quantity}</span>
                  </div>
                ))}
                {request.items.length > 3 && (
                  <p className="text-xs text-gray-500">+{request.items.length - 3} more...</p>
                )}
              </div>
            </div>
          )}

          {/* Logistics Info */}
          {request.logisticsPartnerName && (
            <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
              <Truck className="h-4 w-4" />
              <span>{request.logisticsPartnerName}</span>
            </div>
          )}

          {/* Confirmed Order Success Message */}
          {request.status === 'confirmed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-sm">Order Confirmed!</p>
                  <p className="text-xs text-green-700">
                    {mode === 'seller'
                      ? 'Payment confirmed. Ready for delivery.'
                      : userRole === 'financial_agent'
                        ? 'Payment processed successfully. Order confirmed.'
                        : userRole === 'logistics_agent' || userRole === 'logistics-agent'
                          ? 'Order confirmed and ready for pickup.'
                          : 'Your payment has been confirmed. Order is ready for delivery.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* In Transit Status Message */}
          {request.status === 'in_transit' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-800">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">Order In Transit</p>
                  <p className="text-xs text-blue-700">
                    {mode === 'seller'
                      ? 'Order has been picked up by logistics partner.'
                      : userRole === 'logistics_agent' || userRole === 'logistics-agent'
                        ? request.logisticsPickupConfirmed
                          ? 'You have confirmed pickup. Deliver to buyer.'
                          : 'Pickup pending confirmation.'
                        : 'Your order is on the way!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivered Status Message */}
          {request.status === 'delivered' && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center gap-2 text-purple-800">
                <PackageCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-sm">Order Delivered</p>
                  <p className="text-xs text-purple-700">
                    {mode === 'buyer'
                      ? 'Please confirm receipt of your order.'
                      : 'Order has been delivered to buyer.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completed Status Message */}
          {request.status === 'completed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-sm">Order Completed! 🎉</p>
                  <p className="text-xs text-green-700">
                    {mode === 'seller'
                      ? 'Buyer confirmed receipt. Transaction complete.'
                      : userRole === 'logistics_agent' || userRole === 'logistics-agent'
                        ? 'Delivery confirmed by buyer. Well done!'
                        : 'Thank you for your order!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(request, mode)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {/* SELLER ACTIONS */}
            {mode === 'seller' && userRole !== 'financial_agent' && (
              <>
                {request.status === 'pending_seller_ack' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Acknowledge
                    </Button>
                  </>
                )}

                {/* Handshake View for B2B Consensus Protocol */}
                {request.status === 'pending_seller_approval' && request.escrow_status === 'negotiating_agent' && (
                  <div className="w-full mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg text-white space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-amber-400" />
                      <h4 className="font-serif uppercase tracking-wider text-sm">Buyer Requested Order Protections</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The buyer has requested to use an Independent QC & Escrow service. They proposed:
                      <span className="font-semibold text-white ml-1">
                        {MOCK_QC_AGENTS.find(a => a.id === request.proposed_middleman_id)?.name || 'An agent'}
                      </span>
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptEscrowTerms(request)}
                        className="bg-white text-black hover:bg-slate-200 w-full"
                      >
                        Accept Terms
                      </Button>

                      <div className="flex gap-2 w-full">
                        <Sheet open={isAgentDrawerOpen && activeNegotiationRequest?.id === request.id} onOpenChange={(open: boolean) => {
                          setIsAgentDrawerOpen(open);
                          if (open) setActiveNegotiationRequest(request);
                          else setActiveNegotiationRequest(null);
                        }}>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-transparent border-slate-700 text-white hover:bg-slate-800"
                            >
                              Decline & Propose Alternative
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="bg-white border-l-0 w-full sm:max-w-md p-0 flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex-none pb-4">
                              <SheetHeader>
                                <SheetTitle className="font-serif text-2xl text-black">Verified QC Directory</SheetTitle>
                                <SheetDescription className="text-gray-500 text-sm mt-1">
                                  Propose an alternative quality control agent to the buyer.
                                </SheetDescription>
                              </SheetHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 text-black">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Available Agents</h4>
                              {MOCK_QC_AGENTS.filter(a => a.id !== request.proposed_middleman_id).map(agent => (
                                <div key={agent.id} className="border border-gray-200 rounded-xl p-4 hover:border-black transition-colors relative">
                                  {agent.certified && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide">
                                      <ShieldCheck className="w-3 h-3" />
                                      CERTIFIED
                                    </div>
                                  )}
                                  <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center shrink-0">
                                      <UserCheck className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-16">
                                      <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {agent.location}
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                          <Star className="w-3 h-3 fill-current" />
                                          <span className="text-gray-700 font-medium">{agent.rating}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex gap-2">
                                    <Button
                                      className="w-full text-xs h-8 bg-black hover:bg-gray-800 text-white"
                                      onClick={() => handleCounterOfferAgent(request, agent.id)}
                                    >
                                      Propose Agent
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </SheetContent>
                        </Sheet>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeclineEscrowEntirely(request)}
                          className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          Decline Escrow Entirely
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NEW MULTI-PARTY APPROVAL ACTIONS */}
                {request.status === 'pending_multi_party_approval' && needsMyApproval(request) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Order
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Order
                    </Button>
                  </>
                )}

                {(request.status === 'pending_dual_approval' || request.status === 'finance_approved_seller_pending') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSellerAcceptOrder(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept Order
                    </Button>
                  </>
                )}

                {request.status === 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => handleSellerConfirmPaidOrder(request)}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </Button>
                )}

                {request.status === 'confirmed' && (
                  <Button
                    size="sm"
                    onClick={() => handleSellerMarkPickedUp(request)}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark as Picked Up
                  </Button>
                )}

                {request.status === 'in_transit' && (
                  <div className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                    🚚 In Transit
                  </div>
                )}

                {(request.status === 'delivered' || request.status === 'completed') && (
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                      ✅ {request.status === 'completed' ? 'Order Completed' : 'Delivered'}
                    </div>
                    {request.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full border-green-200 bg-green-100 hover:bg-green-200 text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={ratedOrderIds.includes(request.id)}
                        onClick={() => {
                          setRatingTargetRequest(request);
                          setRatingDialogOpen(true);
                        }}
                      >
                        {ratedOrderIds.includes(request.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Rated
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Rate Buyer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* BUYER ACTIONS */}
            {mode === 'buyer' && request.status === 'seller_acknowledged' && (
              <Button
                size="sm"
                onClick={() => openCheckoutFlow(request)}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Truck className="h-4 w-4 mr-2" />
                Select Logistics
              </Button>
            )}

            {/* BUYER PAYMENT ACTION */}
            {mode === 'buyer' && request.status === 'awaiting_payment' && (
              <Button
                size="sm"
                onClick={() => handleRazorpayPayment(request)}
                disabled={processingPayment || !razorpayLoaded}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {processingPayment ? 'Processing...' : !razorpayLoaded ? 'Loading Gateway...' : 'Proceed to Payment'}
              </Button>
            )}

            {/* BUYER - PAYMENT PENDING CONFIRMATION */}
            {mode === 'buyer' && request.status === 'paid' && (
              <div className="flex-1 text-center py-2 bg-yellow-50 text-yellow-700 rounded-md text-sm font-medium border border-yellow-200">
                <Clock className="h-4 w-4 inline mr-2" />
                Waiting for Seller Confirmation
              </div>
            )}

            {/* BUYER - ORDER CONFIRMED */}
            {mode === 'buyer' && request.status === 'confirmed' && (
              <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                ✅ Order Confirmed & Ready
              </div>
            )}

            {/* BUYER - IN TRANSIT */}
            {mode === 'buyer' && request.status === 'in_transit' && (
              <div className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">
                <Truck className="h-4 w-4 inline mr-2" />
                Order In Transit
              </div>
            )}

            {/* BUYER - DELIVERED, CONFIRM RECEIPT */}
            {mode === 'buyer' && request.status === 'delivered' && (
              <Button
                size="sm"
                onClick={() => handleBuyerConfirmReceived(request)}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Received
              </Button>
            )}

            {/* BUYER - COMPLETED */}
            {mode === 'buyer' && request.status === 'completed' && (
              <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                ✅ Order Completed
              </div>
            )}

            {/* FINANCIAL AGENT ACTIONS */}
            {userRole === 'financial_agent' && (
              <>
                {/* Multi-party approval for financial agents */}
                {request.status === 'pending_multi_party_approval' && needsMyApproval(request) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-purple-600 hover:bg-purple-700 flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Financing
                    </Button>
                  </>
                )}

                {/* Legacy dual approval */}
                {(request.status === 'pending_dual_approval' || request.status === 'seller_approved_finance_pending') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveFinancing(request)}
                      className="bg-purple-600 hover:bg-purple-700 flex-1"
                    >
                      Approve Financing
                    </Button>
                  </>
                )}

                {/* Financial Agent - Confirmed Order */}
                {(request.status === 'confirmed' || request.status === 'in_transit' || request.status === 'delivered' || request.status === 'completed') && (
                  <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                    ✅ Order Confirmed
                  </div>
                )}
              </>
            )}

            {/* LOGISTICS AGENT ACTIONS */}
            {(userRole === 'logistics_agent' || userRole === 'logistics-agent') && (
              <>
                {/* Multi-party approval for logistics agents */}
                {request.status === 'pending_multi_party_approval' && needsMyApproval(request) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Delivery
                    </Button>
                  </>
                )}

                {/* Waiting for payment */}
                {(request.status === 'awaiting_payment' || request.status === 'paid') && (
                  <div className="flex-1 text-center py-2 bg-yellow-50 text-yellow-700 rounded-md text-sm font-medium border border-yellow-200">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Awaiting Payment
                  </div>
                )}

                {/* Order confirmed, ready for pickup */}
                {request.status === 'confirmed' && (
                  <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                    ✅ Ready for Pickup
                  </div>
                )}

                {/* In transit - confirm pickup and mark delivered */}
                {request.status === 'in_transit' && (
                  <>
                    {!request.logisticsPickupConfirmed && (
                      <Button
                        size="sm"
                        onClick={() => handleLogisticsConfirmPickup(request)}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        <PackageCheck className="h-4 w-4 mr-2" />
                        Confirm Pickup
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleLogisticsMarkDelivered(request)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  </>
                )}

                {/* Delivered */}
                {(request.status === 'delivered' || request.status === 'completed') && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex-1 text-center py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                      ✅ {request.status === 'completed' ? 'Delivery Confirmed' : 'Delivered'}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={ratedOrderIds.includes(request.id)}
                      onClick={() => {
                        setRatingTargetRequest(request);
                        setRatingDialogOpen(true);
                      }}
                    >
                      {ratedOrderIds.includes(request.id) ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Rated
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Rate Buyer
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filterOrders = (orders: PurchaseRequest[]) => {
    return orders.filter(order => {
      const matchesSearch =
        (order.stockName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.buyerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.sellerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const IncomingOrdersList = () => {
    const filtered = filterOrders(incomingRequests);

    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Incoming Orders</h3>
          </div>
          <div className="flex justify-center p-12 border border-dashed rounded-lg bg-gray-50">
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      );
    }

    // Calculate unread/actionable
    const actionCount = filtered.filter(r =>
      r.status === 'pending_seller_ack' ||
      r.status === 'pending_dual_approval' ||
      r.status === 'finance_approved_seller_pending' ||
      r.status === 'paid'
    ).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {userRole === 'logistics_agent' || userRole === 'logistics-agent' ? 'My Delivery Requests' :
              userRole === 'financial_agent' || userRole === 'financial' ? 'Finance Requests' :
                'Incoming Orders'}
          </h3>
          {actionCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {actionCount} Action Needed
            </span>
          )}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">
                  {userRole === 'logistics_agent' || userRole === 'logistics-agent' ? 'No Delivery Requests' :
                    userRole === 'financial_agent' || userRole === 'financial' ? 'No Finance Requests' :
                      'No Incoming Orders'}
                </h4>
                <p className="text-sm">
                  {userRole === 'logistics_agent' || userRole === 'logistics-agent' ? 'You have no delivery requests assigned to you.' :
                    userRole === 'financial_agent' || userRole === 'financial' ? 'You have no finance requests to review.' :
                      'You have no incoming orders.'}
                </p>
                {/* Debug info hidden for production */}
              </CardContent>
            </Card>
          ) : (
            filtered.map(req => (
              <RequestCard key={req.id} request={req} mode="seller" />
            ))
          )}
        </div>
      </div>
    )
  };

  const MyOrdersList = () => {
    const filtered = filterOrders(myOrders);

    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">My Orders History</h3>
          </div>
          <div className="flex justify-center p-12 border border-dashed rounded-lg bg-gray-50">
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">My Orders History</h3>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h4>
                <p className="text-sm">You haven't placed any orders yet.</p>
                {/* Debug info hidden for production */}
              </CardContent>
            </Card>
          ) : (
            filtered.map(req => (
              <RequestCard key={req.id} request={req} mode="buyer" />
            ))
          )}
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders & Requests</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, Item, or Company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_seller_ack">Pending Action</SelectItem>
            <SelectItem value="pending_dual_approval">Pending Approval</SelectItem>
            <SelectItem value="paid">Paid (Unconfirmed)</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile View: Tabs */}
      <div className="md:hidden">
        {userRole === 'supplier' ? (
          <IncomingOrdersList />
        ) : userRole === 'retailer' ? (
          <MyOrdersList />
        ) : (
          <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="incoming" className="relative">
                Incoming
                {incomingRequests.some(r => r.status === 'pending_dual_approval') && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming">
              <IncomingOrdersList />
            </TabsContent>

            <TabsContent value="history">
              <MyOrdersList />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Desktop View: Side-by-Side Grid */}
      <div className="hidden md:block">
        {userRole === 'supplier' ? (
          <IncomingOrdersList />
        ) : userRole === 'retailer' ? (
          <MyOrdersList />
        ) : (
          <div className="grid grid-cols-2 gap-8">
            <div className="border-r pr-6">
              <IncomingOrdersList />
            </div>
            <div className="pl-2">
              <MyOrdersList />
            </div>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about this purchase request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">#{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{selectedRequest.stockName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{selectedRequest.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <p className="font-medium">{selectedRequest.buyerCompany || selectedRequest.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedRequest.sellerCompany || selectedRequest.sellerName}</p>
                </div>
              </div>

              {/* Multi-Party Approval Status */}
              {selectedRequest.status === 'pending_multi_party_approval' && selectedRequest.approvals && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Approval Status
                  </h4>
                  <div className="space-y-3">
                    {/* Seller Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Seller</span>
                      {selectedRequest.approvals.seller?.status === 'approved' ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : selectedRequest.approvals.seller?.status === 'rejected' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>

                    {/* Logistics Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Logistics Partner</span>
                      {selectedRequest.approvals.logistics?.status === 'approved' ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : selectedRequest.approvals.logistics?.status === 'rejected' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>

                    {/* Financial Agent Approval (if applicable) */}
                    {selectedRequest.paymentMode === 'finance' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Financial Agent</span>
                        {selectedRequest.approvals.financial?.status === 'approved' ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : selectedRequest.approvals.financial?.status === 'rejected' ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm">Color</th>
                          <th className="px-4 py-2 text-left text-sm">Size</th>
                          <th className="px-4 py-2 text-right text-sm">Quantity</th>
                          <th className="px-4 py-2 text-right text-sm">Price/Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2">{item.colorId}</td>
                            <td className="px-4 py-2">{item.sizeId}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">₹{item.pricePerUnit?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedRequest.logisticsPartnerName && (
                <div>
                  <p className="text-sm text-muted-foreground">Logistics Partner</p>
                  <p className="font-medium">{selectedRequest.logisticsPartnerName}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logistics & Payment Flow Dialog */}
      <Dialog open={logisticsDialogOpen} onOpenChange={setLogisticsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Select payment mode, logistics partner, and review all details
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <MultiStepCheckout
              request={selectedRequest}
              onComplete={handleCheckoutComplete}
              onCancel={() => setLogisticsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Process payment for your order
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <CheckoutPayment
              request={selectedRequest}
              onSuccess={async (transactionId) => {
                // Update request to paid status
                await purchaseService.completePayment(selectedRequest.id, transactionId, 'razorpay');
                await purchaseService.updateStatus(selectedRequest.id, 'paid');
                toast.success('Payment successful! Waiting for seller confirmation.');
                setPaymentDialogOpen(false);
              }}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <StunningRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        mode="seller"
        orderId={ratingTargetRequest?.id || ''}
        targets={{
          buyer: ratingTargetRequest ? {
            id: ratingTargetRequest.buyerId,
            name: ratingTargetRequest.buyerName,
            company: ratingTargetRequest.buyerCompany || ratingTargetRequest.buyerName
          } : undefined
        }}
        existingReviews={{
          // Ideally fetch existing rating here if we want to show it, 
          // but for simplicity we can start fresh or let the dialog handle it if we passed the callback.
          // For now, undefined means "new rating" or "not loaded yet".
          // If we want to support editing, we'd need to fetch the rating like in OrdersWithRatings.
        }}
        onSubmit={async (data) => {
          if (data.buyerRating && ratingTargetRequest && user?.id) {
            try {
              // Save review to Firestore for persistence
              await reviewService.addReview({
                orderId: ratingTargetRequest.id,
                reviewerId: user.id,
                reviewerRole: 'seller',
                targetId: ratingTargetRequest.buyerId,
                rating: data.buyerRating,
                comment: data.comment,
                categories: data.categories,
                createdAt: new Date().toISOString()
              });

              // Update local state to show "Rated" button immediately
              setRatedOrderIds(prev => [...prev, ratingTargetRequest.id]);
              toast.success('Rating submitted successfully!');

              // Close dialog
              setRatingDialogOpen(false);
              setRatingTargetRequest(null);
            } catch (error) {
              console.error('Error submitting rating:', error);
              toast.error('Failed to save rating');
            }
          }
        }}
      />
    </div>
  );
}
