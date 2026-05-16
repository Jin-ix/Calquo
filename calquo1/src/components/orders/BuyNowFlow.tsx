import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Package,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Star,
  Phone,
  Edit,
  Smartphone,
  Building,
  Wallet,
  Loader2,
  QrCode,
  ExternalLink,
  Shield,
  ArrowRight,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../auth/AuthProvider';
import { updateDocument, addDocument, getDocuments, getDocument } from '../../utils/firebase/firestore';
import { supabase } from '../../utils/supabase/client';
import { LogisticsAgent, MAJOR_INDIAN_CITIES } from '../logistics/LogisticsTypes';

// Mock Logistics Agents for Fallback
const MOCK_LOGISTICS_AGENTS: LogisticsAgent[] = [
  {
    id: 'mock_1',
    name: 'Delhivery Standard',
    gstNumber: '27DELHI1234F1Z5',
    mobileNumber: '+91 98765 43210',
    serviceArea: { type: 'all-india' },
    isActive: true,
    dateAdded: new Date().toISOString(),
    rating: 4.8,
    totalDeliveries: 1250,
    specialServices: ['Express', 'QC Check']
  },
  {
    id: 'mock_2',
    name: 'BlueDart Prime',
    gstNumber: '29BLUE1234F1Z5',
    mobileNumber: '+91 87654 32109',
    serviceArea: { type: 'selected-cities', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'] },
    isActive: true,
    dateAdded: new Date().toISOString(),
    rating: 4.9,
    totalDeliveries: 3400,
    specialServices: ['Air Cargo', 'B2B Priority']
  },
  {
    id: 'mock_3',
    name: 'Shadowfax Local',
    gstNumber: '27SHADOW1234F1Z5',
    mobileNumber: '+91 76543 21098',
    serviceArea: { type: 'selected-cities', cities: ['Mumbai', 'Thane', 'Navi Mumbai'] },
    isActive: true,
    dateAdded: new Date().toISOString(),
    rating: 4.5,
    totalDeliveries: 850,
    specialServices: ['Last Mile', 'Surface']
  }
];

export interface BuyNowItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string;
  size?: string;
  sku?: string;
  sellerId?: string;
  seller_name?: string;
}

interface BuyNowFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BuyNowItem[];
  onSuccess?: () => void;
  middlemanRequested?: boolean;
  middlemanRequestedBy?: 'buyer' | 'seller' | null;
  middlemanFeePayer?: 'buyer' | 'seller' | 'split' | null;
  destinationCity?: string;
  proposedMiddlemanId?: string | null;
}

type FlowStep = 'summary' | 'location' | 'logistics' | 'payment' | 'success';

export function BuyNowFlow({
  open,
  onOpenChange,
  items,
  onSuccess,
  middlemanRequested = false,
  middlemanRequestedBy = null,
  middlemanFeePayer = null,
  destinationCity: initialDestinationCity = '',
  proposedMiddlemanId = null
}: BuyNowFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('summary');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');

  // Location details
  const [useCompanyLocation, setUseCompanyLocation] = useState<'yes' | 'no'>('yes');
  const [deliveryCity, setDeliveryCity] = useState(initialDestinationCity);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Company location (fetched from user profile)
  const [companyCity, setCompanyCity] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPincode, setCompanyPincode] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Logistics
  const [logisticsAgents, setLogisticsAgents] = useState<LogisticsAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Calculate totals using useMemo to avoid initialization issues
  const { subtotal, gst, total } = React.useMemo(() => {
    const sub = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstAmount = sub * 0.18; // 18% GST
    const totalAmount = sub + gstAmount;
    return { subtotal: sub, gst: gstAmount, total: totalAmount };
  }, [items]);

  // BHIM UPI Configuration (uses total from useMemo)
  const bhimConfig = React.useMemo(() => ({
    vpa: 'calico@upi',
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=calico@upi&pn=CALICO&am=${total}&cu=INR`,
    deepLink: `upi://pay?pa=calico@upi&pn=CALICO&am=${total}&cu=INR`
  }), [total]);

  // Load logistics agents and user profile data
  useEffect(() => {
    if (open) {
      loadLogisticsAgents();
      fetchCompanyLocationFromFirestore();
    }
  }, [open, user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchCompanyLocationFromFirestore = async () => {
    try {
      // Get user's GST number from multiple possible sources
      // @ts-ignore - Some fields might be in custom claims or extended profile
      const rawGst = user?.profile?.gstNumber || user?.gstNumber || user?.profile?.gst_number;
      // @ts-ignore
      const gstNumber = typeof rawGst === 'string' ? rawGst : undefined;

      console.log('[BuyNowFlow] DEBUG - Full user object:', user);
      console.log('[BuyNowFlow] DEBUG - user.profile:', user?.profile);
      console.log('[BuyNowFlow] DEBUG - Extracted GST number:', gstNumber);

      if (!gstNumber) {
        console.warn('[BuyNowFlow] ⚠️ No GST number found in user profile, falling back to user profile address');
        loadFallbackAddress();
        return;
      }

      console.log('[BuyNowFlow] 🔍 Fetching company data from Firestore for GST:', gstNumber);

      // Check for demo/test GSTs first
      const isDemoGst = [
        '27FASHR1234F1Z5', '29FASHCO1234F1Z5', '27AAECE4266B1ZP',
        '29ABCDE1234F1Z5', '22DEMO12345A6Z7'
      ].includes(gstNumber);

      if (isDemoGst) {
        console.log('[BuyNowFlow] 🧪 Detected demo GST, using mock company data:', gstNumber);
        // Provide mock company data for demo users
        const mockCompanyDoc = {
          company_name: user?.company || 'Demo Company',
          address: {
            street: '123 Demo Market',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001'
          },
          // @ts-ignore
          mobile: user?.phone || '+91 98765 43210'
        };

        setCompanyAddress(mockCompanyDoc.address.street);
        setCompanyCity(mockCompanyDoc.address.city);
        setCompanyState(mockCompanyDoc.address.state);
        setCompanyPincode(mockCompanyDoc.address.postalCode);
        setCompanyPhone(mockCompanyDoc.mobile);

        setDeliveryAddress(mockCompanyDoc.address.street);
        setDeliveryCity(mockCompanyDoc.address.city);
        setDeliveryState(mockCompanyDoc.address.state);
        setDeliveryPincode(mockCompanyDoc.address.postalCode);
        setContactPhone(mockCompanyDoc.mobile);

        console.log('[BuyNowFlow] ✅ Mock company data loaded successfully!');
        return;
      }

      // Fetch company document from Firestore using GST as document ID
      let companySnapshot;
      try {
        companySnapshot = await getDocument('companies', gstNumber);
      } catch (error) {
        console.warn('[BuyNowFlow] ⚠️ Failed to fetch company document:', error);
      }

      if (!companySnapshot || !companySnapshot.exists) {
        console.log('[BuyNowFlow] ℹ️ No company document found for GST:', gstNumber);
        // Instead of attempting to create a new one which might fail permissions, directly fallback
        console.log('[BuyNowFlow] 💡 Using fallback from user profile');
        loadFallbackAddress();
        return;
      }

      const companyDoc = companySnapshot.data();
      console.log('[BuyNowFlow] 📄 Company document data:', JSON.stringify(companyDoc, null, 2));

      // Extract address fields with multiple fallbacks
      let street = '';
      let city = '';
      let state = '';
      let postalCode = '';
      let phone = '';

      // Handle address object or direct fields
      if (companyDoc.address) {
        console.log('[BuyNowFlow] 🏠 Address field type:', typeof companyDoc.address);
        console.log('[BuyNowFlow] 🏠 Address field value:', companyDoc.address);

        if (typeof companyDoc.address === 'string') {
          street = companyDoc.address;
        } else if (typeof companyDoc.address === 'object') {
          street = companyDoc.address.street || companyDoc.address.address || companyDoc.address.line1 || '';
          city = companyDoc.address.city || '';
          state = companyDoc.address.state || '';
          postalCode = companyDoc.address.postalCode || companyDoc.address.postal_code || companyDoc.address.pincode || companyDoc.address.zip || '';
        }
      }

      // Fallback to direct fields
      if (!street) street = companyDoc.street_address || companyDoc.street || companyDoc.location || '';
      if (!city) city = companyDoc.city || '';
      if (!state) state = companyDoc.state || '';
      if (!postalCode) postalCode = companyDoc.postal_code || companyDoc.pincode || companyDoc.zip || '';

      // Phone number with multiple fallbacks
      phone = companyDoc.mobile_number || companyDoc.mobile || companyDoc.phone || companyDoc.contact || '';

      console.log('[BuyNowFlow] 📍 Extracted fields:', { street, city, state, postalCode, phone });

      const hasValidAddress = street && city && postalCode;

      if (!hasValidAddress) {
        console.warn('[BuyNowFlow] ⚠️ Company document incomplete - Missing required address fields:', {
          street,
          city,
          postalCode,
          state
        });
        console.log('[BuyNowFlow] 💡 Switching to manual entry mode.');

        // Force user to enter address manually since company profile is incomplete
        setUseCompanyLocation('no');

        // Set company phone if available
        if (phone) {
          setCompanyPhone(phone);
          setContactPhone(phone);
        }

        // Show toast to inform user
        toast.info('Please enter your delivery address', {
          description: 'Your company address is not yet set up in the system.'
        });

        return;
      }

      console.log('[BuyNowFlow] ✅ Company data found with address:', companyDoc);

      // Set company location details
      setCompanyAddress(street);
      setCompanyCity(city);
      setCompanyState(state);
      setCompanyPincode(postalCode);
      setCompanyPhone(phone);

      // Initially set delivery to company location
      setDeliveryAddress(street);
      setDeliveryCity(city);
      setDeliveryState(state);
      setDeliveryPincode(postalCode);
      setContactPhone(phone);

      console.log('[BuyNowFlow] ✅ Company location loaded successfully!');
    } catch (error) {
      console.error('[BuyNowFlow] ❌ Error fetching company location:', error);
      loadFallbackAddress();
    }
  };

  const loadFallbackAddress = () => {
    console.log('[BuyNowFlow] 📍 Loading fallback address from user profile...');

    // Fetch and pre-fill company location from user profile
    if (user?.profile?.address) {
      const address = user.profile.address;

      // Set company location details
      setCompanyAddress(typeof address === 'string' ? address : address.street || '');
      setCompanyCity((user.profile as any).city || (typeof address === 'object' ? address.city : '') || '');
      setCompanyState(typeof address === 'object' ? address.state || '' : '');
      setCompanyPincode(typeof address === 'object' ? address.postalCode || '' : '');
      // @ts-ignore
      setCompanyPhone(user.profile.phone || user.phone || '');

      // Initially set delivery to company location
      setDeliveryAddress(typeof address === 'string' ? address : address.street || '');
      // @ts-ignore
      setDeliveryCity(user.profile.city || (typeof address === 'object' ? address.city : '') || '');
      setDeliveryState(typeof address === 'object' ? address.state || '' : '');
      setDeliveryPincode(typeof address === 'object' ? address.postalCode || '' : '');
      // @ts-ignore
      setContactPhone(user.profile.phone || user.phone || '');

      console.log('[BuyNowFlow] ✅ Fallback address loaded from user profile');
    } else {
      // No address available - force manual entry
      console.log('[BuyNowFlow] ⚠️ No address data found. User must enter manually.');
      setUseCompanyLocation('no');

      // Fallback to basic user info if no address
      // @ts-ignore
      if (user?.phone) {
        // @ts-ignore
        setContactPhone(user.phone);
        // @ts-ignore
        setCompanyPhone(user.phone);
      }

      toast.info('Please enter your delivery address', {
        description: 'No saved address found in your profile.'
      });
    }
  };

  const loadLogisticsAgents = async () => {
    try {
      const agents = await getDocuments('logistics-agents');
      const activeAgents = agents.filter((agent: LogisticsAgent) => agent.isActive);

      if (activeAgents.length === 0) {
        console.log('[BuyNowFlow] ℹ️ No active logistics agents in Firestore, using mock fallback.');
        setLogisticsAgents(MOCK_LOGISTICS_AGENTS);
      } else {
        setLogisticsAgents(activeAgents);
      }
    } catch (error) {
      console.error('Error loading logistics agents:', error);
      setLogisticsAgents(MOCK_LOGISTICS_AGENTS);
    }
  };

  // Filter agents based on selected city
  const filteredAgents = logisticsAgents.filter(agent => {
    if (!deliveryCity) return true;
    if (agent.serviceArea.type === 'all-india') return true;
    return agent.serviceArea.cities?.includes(deliveryCity);
  });

  const selectedAgent = logisticsAgents.find(agent => agent.id === selectedAgentId);

  const handleSummaryNext = () => {
    setCurrentStep('location');
  };

  const handleLocationNext = () => {
    // Get the actual location values based on selection
    const actualCity = useCompanyLocation === 'yes' ? companyCity : deliveryCity;
    const actualAddress = useCompanyLocation === 'yes' ? companyAddress : deliveryAddress;
    const actualPincode = useCompanyLocation === 'yes' ? companyPincode : deliveryPincode;
    const actualPhone = useCompanyLocation === 'yes' ? companyPhone : contactPhone;
    const actualState = useCompanyLocation === 'yes' ? companyState : deliveryState;

    // Validate location
    if (!actualCity.trim()) {
      toast.error('Please select a delivery city');
      return;
    }
    if (!actualAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }
    if (!actualPincode.trim() || actualPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    if (!actualPhone.trim() || actualPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Update delivery fields with actual values if using company location
    if (useCompanyLocation === 'yes') {
      setDeliveryCity(companyCity);
      setDeliveryAddress(companyAddress);
      setDeliveryPincode(companyPincode);
      setDeliveryState(companyState);
      setContactPhone(companyPhone);
    }

    setCurrentStep('logistics');
  };

  const handleLogisticsNext = async () => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    try {
      const rawBuyerId = user?.id || (user as any)?.uid || null;
      const rawSellerId = items[0]?.sellerId || null;

      let buyerId: string | null = null;
      let sellerId: string | null = null;

      // Lookup buyer UUID
      if (rawBuyerId) {
        if (UUID_RE.test(rawBuyerId)) {
          buyerId = rawBuyerId;
        } else {
          const { data } = await supabase.from('companies').select('id').eq('gst_number', rawBuyerId).maybeSingle();
          buyerId = data?.id || null;
        }
      }

      // Lookup seller UUID
      if (rawSellerId) {
        if (UUID_RE.test(rawSellerId)) {
          sellerId = rawSellerId;
        } else {
          const { data } = await supabase.from('companies').select('id').eq('gst_number', rawSellerId).maybeSingle();
          sellerId = data?.id || null;
        }
      }

      console.log('[BuyNowFlow] Inserting purchase_request — buyer_id:', buyerId, 'seller_id:', sellerId);

      // Insert directly to Supabase using only confirmed-valid columns
      let purchaseRequestId: string | null = null;
      
      const { data: prData, error: prError } = await supabase
        .from('purchase_requests')
        .insert([{
          buyer_id: buyerId,
          seller_id: sellerId,
          total_amount: total,
          payment_mode: 'direct'
        }])
        .select('id');

      if (prError) {
        console.error('[BuyNowFlow] purchase_request insert FAILED:', prError.code, prError.message, prError.details);
      } else if (prData && prData.length > 0) {
        purchaseRequestId = prData[0].id;
        console.log('[BuyNowFlow] ✅ purchase_requests created:', prData);
      }

      // Notify the seller (best-effort, non-blocking)
      if (sellerId) {
        supabase.from('notifications').insert([{
          user_id: sellerId,
          content: `New order from ${user?.company || user?.name || 'a retailer'} — ₹${total.toLocaleString()}`,
          is_read: false,
        }]).then().catch(() => {});
      }

      setOrderId(purchaseRequestId || '');

      if (middlemanRequested) {
        toast.success('Proposal Drafted! Sent to manufacturer for review.');
        setCurrentStep('success');
        onSuccess?.();
      } else {
        toast.success('Order created! Proceeding to payment...');
        setCurrentStep('payment');
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Error in handleLogisticsNext:', error);
      // Even if DB fails, still allow user to proceed to payment
      toast.info('Proceeding to payment...');
      setCurrentStep('payment');
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async (
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    try {
      const rawBuyerId = user?.id || (user as any)?.uid || null;
      const rawSellerId = items[0]?.sellerId || null;

      let buyerId: string | null = null;
      let sellerId: string | null = null;

      // Lookup buyer UUID
      if (rawBuyerId) {
        if (UUID_RE.test(rawBuyerId)) {
          buyerId = rawBuyerId;
        } else {
          const { data } = await supabase.from('companies').select('id').eq('gst_number', rawBuyerId).maybeSingle();
          buyerId = data?.id || null;
        }
      }

      // Lookup seller UUID
      if (rawSellerId) {
        if (UUID_RE.test(rawSellerId)) {
          sellerId = rawSellerId;
        } else {
          const { data } = await supabase.from('companies').select('id').eq('gst_number', rawSellerId).maybeSingle();
          sellerId = data?.id || null;
        }
      }

      console.log('[BuyNowFlow] handlePaymentSuccess — buyer_id:', buyerId, 'seller_id:', sellerId);

      // 1. Create order in Supabase directly matching exact schema
      let newOrderId: string | null = null;
      
      const orderPayloads = items.map(item => ({
        buyer_id: buyerId,
        seller_id: sellerId,
        stock_id: UUID_RE.test(item.id || '') ? item.id : null,
        buyer_company_name: user?.company || user?.name || null,
        buyer_email: user?.email || null,
        supplier_name: item.seller_name || null,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: item.price * item.quantity,
        payment_method: 'direct'
        // status and payment_status omitted to use database defaults
      }));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayloads)
        .select('id');

      if (orderError) {
        console.error('[BuyNowFlow] order insert FAILED:', orderError.code, orderError.message, orderError.details);
      } else if (orderData && orderData.length > 0) {
        newOrderId = orderData[0].id;
        console.log('[BuyNowFlow] ✅ orders created:', orderData);
      }

      // 2. Create payment record (best-effort)
      const { error: payError } = await supabase.from('payments').insert([{
        order_id:     newOrderId,
        total_amount: total,
        payment_id:   razorpayPaymentId,
        // status omitted to use database default
      }]);
      if (payError) console.error('[BuyNowFlow] payment insert FAILED:', payError.code, payError.message);
      else console.log('[BuyNowFlow] ✅ payment record created');

      // 3. Update purchase_request status (best-effort)
      if (orderId && !orderId.startsWith('local_')) {
        supabase.from('purchase_requests')
          .update({ status: 'paid' })
          .eq('id', orderId)
          .then().catch(() => {});
      }

      // 4. Notify seller (best-effort)
      if (sellerId) {
        supabase.from('notifications').insert([{
          user_id: sellerId,
          content: `Payment of ₹${total.toLocaleString()} received. Order confirmed.`,
          is_read: false,
        }]).then().catch(() => {});
      }

      setPaymentId(razorpayPaymentId);
      setShowPayment(false);
      setCurrentStep('success');
      toast.success('Payment successful! Order confirmed.');
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error);
      setCurrentStep('success');
      toast.success('Payment received!');
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    toast.info('Payment cancelled');
  };

  const handleClose = () => {
    if (currentStep === 'success') {
      onSuccess?.();
    }

    // Reset state
    setCurrentStep('summary');
    setOrderId('');
    setPaymentId('');
    setDeliveryCity('');
    setDeliveryAddress('');
    setDeliveryPincode('');
    setDeliveryState('');
    setContactPhone('');
    setSelectedAgentId('');
    setSpecialInstructions('');
    setShowPayment(false);

    onOpenChange(false);
  };

  const renderSummary = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <Package className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-3xl font-serif tracking-tight text-zinc-900">Order Summary</h3>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">Review your items</p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-xs px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full border-0">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </Badge>
      </div>

      {/* Items List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
        {items.map((item, index) => {
          const itemImageUrl = resolveImageUrl(item.image);
          return (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 24 }}
              key={index} 
              className="flex gap-5 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group hover:border-zinc-200"
            >
              <div className="relative overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100">
                {itemImageUrl ? (
                  <img
                    src={itemImageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-24 h-24 flex flex-col items-center justify-center text-zinc-300">
                    <Package className="h-8 w-8 opacity-20 mb-2" strokeWidth={1.5} />
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <p className="font-serif text-xl text-zinc-900 truncate tracking-tight group-hover:text-black transition-colors">{item.name}</p>
                  {(item.color || item.size) && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.color && <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-zinc-50/50 rounded-md border-zinc-200">{item.color}</Badge>}
                      {item.size && <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-zinc-50/50 rounded-md border-zinc-200">{item.size}</Badge>}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 bg-zinc-50 rounded-lg p-2 px-3 border border-zinc-100">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                    <span>Qty:</span>
                    <span className="text-zinc-900 bg-white px-2 py-0.5 rounded shadow-sm border border-zinc-200">{item.quantity}</span>
                  </div>
                  <span className="font-serif text-lg text-black">{(item.price * item.quantity).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Separator className="bg-zinc-100" />

      {/* Price Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 bg-gradient-to-br from-zinc-50 to-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] font-bold text-zinc-500 items-center">
          <span>Subtotal</span>
          <span className="text-zinc-700 font-mono text-sm">{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
        </div>
        <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] font-bold text-zinc-500 items-center">
          <span className="flex items-center gap-2">
            GST <Badge variant="secondary" className="text-[9px] h-5 px-1.5 rounded-sm">18%</Badge>
          </span>
          <span className="text-zinc-700 font-mono text-sm">{gst.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
        </div>
        
        <div className="pt-4 mt-2 border-t border-zinc-200 border-dashed relative z-10">
          <div className="flex justify-between items-end">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-1">Grand Total</span>
              <span className="font-serif text-3xl text-black leading-none">{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-2"
      >
        <Button onClick={handleSummaryNext} className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold shadow-xl shadow-black/10 transition-all hover:scale-[1.02] gap-3">
          Continue to Delivery
          <ChevronRight className="h-4 w-4 bg-white/20 rounded-full p-0.5" />
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderLocation = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <MapPin className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-3xl font-serif tracking-tight text-zinc-900">Delivery Location</h3>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">Where should we send this?</p>
          </div>
        </div>

        {/* Show current company location */}
        {companyAddress && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-50 border border-blue-100 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2.5 rounded-full bg-white border border-blue-100 shadow-sm mt-0.5">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-900 tracking-tight text-lg mb-1">Your Company Location</p>
                <p className="text-sm text-blue-800/80 leading-relaxed max-w-sm">{companyAddress}, {companyCity}{companyState && `, ${companyState}`} - {companyPincode}</p>
                {companyPhone && (
                  <div className="flex items-center gap-2 mt-3 inline-flex bg-white/60 px-3 py-1.5 rounded-full border border-blue-100 text-xs font-bold text-blue-900 shadow-sm">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{companyPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          <div>
            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 block flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
              Delivery Location Option
            </Label>
            <RadioGroup value={useCompanyLocation} onValueChange={(value: string) => setUseCompanyLocation(value as 'yes' | 'no')} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label 
                htmlFor="yes" 
                className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${!companyAddress ? 'opacity-50 grayscale cursor-not-allowed' : useCompanyLocation === 'yes' ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white text-zinc-900'}`}
              >
                <RadioGroupItem value="yes" id="yes" disabled={!companyAddress} className="sr-only" />
                <div className="relative z-10">
                  <span className={`font-serif text-2xl tracking-tight block mb-2 transition-colors ${useCompanyLocation === 'yes' ? 'text-white' : 'text-black'}`}>Company</span>
                  <span className={`text-[10px] uppercase tracking-widest font-bold leading-relaxed transition-colors ${useCompanyLocation === 'yes' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {companyAddress ? 'Deliver to your registered address' : 'No company address available'}
                  </span>
                </div>
              </label>

              <label 
                htmlFor="no" 
                className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${useCompanyLocation === 'no' ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white text-zinc-900'}`}
              >
                <RadioGroupItem value="no" id="no" className="sr-only" />
                <div className="relative z-10">
                  <span className={`font-serif text-2xl tracking-tight block mb-2 transition-colors ${useCompanyLocation === 'no' ? 'text-white' : 'text-black'}`}>Custom</span>
                  <span className={`text-[10px] uppercase tracking-widest font-bold leading-relaxed transition-colors ${useCompanyLocation === 'no' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Enter a different delivery address
                  </span>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Show company location details when selected */}
          <AnimatePresence mode="wait">
            {useCompanyLocation === 'yes' && companyAddress && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      Delivery will be sent to:
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseCompanyLocation('no')}
                      className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 hover:text-black hover:bg-zinc-100 h-8 rounded-full px-3"
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Change
                    </Button>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-full border border-zinc-200 shadow-sm">
                      <MapPin className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-serif text-lg tracking-tight text-black mb-1">{companyAddress}</p>
                      <p className="text-sm text-zinc-500 font-medium">
                        {companyCity}{companyState && `, ${companyState}`} - {companyPincode}
                      </p>
                      {companyPhone && (
                        <div className="flex items-center gap-2 mt-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          {companyPhone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {useCompanyLocation === 'no' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-6 border-t border-zinc-100">
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    Enter new delivery location:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="city" className="text-xs font-bold text-zinc-700">City *</Label>
                      <Select value={deliveryCity} onValueChange={setDeliveryCity}>
                        <SelectTrigger id="city" className="h-12 rounded-xl mt-1.5 border-zinc-200 bg-zinc-50/50 hover:bg-white transition-colors focus:ring-black">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200">
                          {MAJOR_INDIAN_CITIES.map(city => (
                            <SelectItem key={city} value={city} className="rounded-lg">{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-xs font-bold text-zinc-700">Delivery Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter complete delivery address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={3}
                        className="rounded-xl mt-1.5 border-zinc-200 bg-zinc-50/50 hover:bg-white transition-colors focus-visible:ring-black resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pincode" className="text-xs font-bold text-zinc-700">Pincode *</Label>
                        <Input
                          id="pincode"
                          type="text"
                          placeholder="6-digit pincode"
                          value={deliveryPincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setDeliveryPincode(value);
                          }}
                          maxLength={6}
                          className="h-12 rounded-xl mt-1.5 border-zinc-200 bg-zinc-50/50 hover:bg-white transition-colors focus-visible:ring-black"
                        />
                      </div>

                      <div>
                        <Label htmlFor="state" className="text-xs font-bold text-zinc-700">State *</Label>
                        <Input
                          id="state"
                          type="text"
                          placeholder="Enter state"
                          value={deliveryState}
                          onChange={(e) => setDeliveryState(e.target.value)}
                          className="h-12 rounded-xl mt-1.5 border-zinc-200 bg-zinc-50/50 hover:bg-white transition-colors focus-visible:ring-black"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-xs font-bold text-zinc-700">Contact Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={contactPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setContactPhone(value);
                        }}
                        maxLength={10}
                        className="h-12 rounded-xl mt-1.5 border-zinc-200 bg-zinc-50/50 hover:bg-white transition-colors focus-visible:ring-black"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 pt-6 border-t border-zinc-100"
        >
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('summary')} 
            className="flex-1 rounded-xl h-14 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 uppercase tracking-[0.2em] text-[10px] font-bold transition-all hover:scale-[1.02]"
          >
            Back
          </Button>
          <Button 
            onClick={handleLocationNext} 
            className="flex-[2] bg-black hover:bg-zinc-800 text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold h-14 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] gap-2"
          >
            Continue
            <ChevronRight className="h-4 w-4 bg-white/20 rounded-full p-0.5" />
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  const renderLogistics = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <Truck className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-3xl font-serif tracking-tight text-zinc-900">Select Logistics Partner</h3>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">Choose your preferred delivery agent</p>
          </div>
        </div>

        {filteredAgents.length > 0 ? (
          <RadioGroup value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
              {filteredAgents.map((agent, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                  key={agent.id}
                >
                  <label 
                    htmlFor={agent.id} 
                    className={`relative block w-full p-6 cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
                      selectedAgentId === agent.id 
                        ? 'border-black bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] scale-[1.02]' 
                        : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <RadioGroupItem value={agent.id} id={agent.id} className="sr-only" />
                    
                    {/* Background glowing effect when selected */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-zinc-100 to-transparent opacity-0 transition-opacity duration-500 ${selectedAgentId === agent.id ? 'opacity-100' : ''}`} />
                    
                    <div className="relative z-10 flex items-start gap-5">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 mt-0.5 ${
                        selectedAgentId === agent.id 
                          ? 'border-black bg-black' 
                          : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                      }`}>
                        {selectedAgentId === agent.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle className="h-3 w-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <p className={`font-serif text-2xl tracking-tight transition-colors duration-300 ${selectedAgentId === agent.id ? 'text-black' : 'text-zinc-700'}`}>
                            {agent.name}
                          </p>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors duration-300 ${
                            selectedAgentId === agent.id 
                              ? 'bg-black text-white' 
                              : 'bg-white border border-zinc-200 text-zinc-700'
                          }`}>
                            <Star className={`h-3 w-3 ${selectedAgentId === agent.id ? 'fill-white text-white' : 'fill-zinc-400 text-zinc-400'}`} />
                            <span className="text-[10px] font-bold tracking-widest">{(agent.rating || 0).toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${selectedAgentId === agent.id ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            <div className={`p-1.5 rounded-full ${selectedAgentId === agent.id ? 'bg-zinc-100' : 'bg-white border border-zinc-100'}`}>
                              <Phone className="h-3.5 w-3.5" />
                            </div>
                            <span>{agent.mobileNumber}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${selectedAgentId === agent.id ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            <div className={`p-1.5 rounded-full ${selectedAgentId === agent.id ? 'bg-zinc-100' : 'bg-white border border-zinc-100'}`}>
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            <span>
                              {agent.serviceArea.type === 'all-india'
                                ? 'All India Coverage'
                                : `${agent.serviceArea.cities?.length || 0} Cities Selected`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert className="rounded-xl border-dashed border-2 border-zinc-200 bg-zinc-50/50 p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-zinc-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-widest">No Partners Found</h4>
              <AlertDescription className="text-zinc-500 text-sm max-w-sm">
                No logistics partners available for <strong className="text-black">{deliveryCity}</strong>. You can proceed without selecting an agent and we'll arrange logistics for you.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Label htmlFor="instructions" className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            Special Instructions (Optional)
          </Label>
          <Textarea
            id="instructions"
            placeholder="E.g., Please deliver during business hours..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            className="rounded-xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-black focus-visible:bg-white transition-all resize-none shadow-sm"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 pt-6 mt-4 border-t border-zinc-100"
        >
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('location')} 
            className="flex-1 rounded-xl h-14 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 uppercase tracking-[0.2em] text-[10px] font-bold transition-all hover:scale-[1.02]"
          >
            Back
          </Button>
          <Button
            onClick={handleLogisticsNext}
            className="flex-[2] bg-black hover:bg-zinc-800 text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold h-14 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {middlemanRequested ? 'Draft Proposal' : 'Proceed to Payment'}
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Payment handlers
  const handleBhimPayment = () => {
    setShowQr(true);
  };

  const openUpiApp = () => {
    window.location.href = bhimConfig.deepLink;
    toast.info('Opening BHIM UPI app...');
  };

  const verifyBhimPayment = async () => {
    setPaymentLoading(true);
    // Simulate payment verification
    setTimeout(async () => {
      try {
        // Mock payment ID for demo
        const mockPaymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
        const mockOrderId = 'order_' + Math.random().toString(36).substr(2, 9);
        const mockSignature = 'sig_' + Math.random().toString(36).substr(2, 9);

        await handlePaymentSuccess(mockPaymentId, mockOrderId, mockSignature);
        setPaymentLoading(false);
      } catch (error) {
        setPaymentLoading(false);
        toast.error('Payment verification failed');
      }
    }, 2000);
  };

  const handleRazorpayPayment = () => {
    // Use the existing RazorpayCheckout component logic
    toast.info('Opening Razorpay payment gateway...');
    // This would open the Razorpay modal in production
  };

  const renderPayment = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <CreditCard className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-3xl font-serif tracking-tight text-zinc-900">Secure Payment</h3>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">Complete your transaction</p>
          </div>
        </div>

        {/* Order Summary - Dense & Editorial */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 p-6 rounded-2xl shadow-sm"
        >
          <h3 className="font-serif text-xl mb-4 text-zinc-900 flex items-center justify-between border-b border-zinc-100 pb-3">
            <span>Order Overview</span>
            <span className="font-mono text-lg font-bold">{formatCurrency(total)}</span>
          </h3>
          <div className="space-y-3 text-[10px] uppercase tracking-widest font-medium">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-zinc-600 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
                <span className="truncate pr-4 text-zinc-900 flex items-center gap-2">
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-[9px] rounded-md">{item.quantity}×</Badge> 
                  {item.name}
                </span>
                <span className="whitespace-nowrap text-black font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment Methods Grid - Stacked */}
        <div className="flex flex-col gap-5">
          {/* BHIM UPI - Highlighted */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl border-2 border-black bg-black text-white p-6 relative group transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <h4 className="font-serif text-2xl tracking-tight flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Smartphone className="h-5 w-5" strokeWidth={1.5} />
                </div>
                BHIM UPI
              </h4>
              <div className="bg-white text-black px-3 py-1.5 text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 rounded-full shadow-sm">
                <Zap className="h-3 w-3 text-yellow-500" strokeWidth={2.5} /> <span className="text-black !text-black" style={{ color: 'black' }}>Recommended</span>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {!showQr ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                        <span className="text-zinc-300">Zero transaction fees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                        <span className="text-zinc-300">Instant verification</span>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1.5">UPI Virtual Address:</p>
                      <div className="font-mono text-sm text-white tracking-wider">
                        {bhimConfig.vpa}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-end sm:w-48">
                    <Button
                      onClick={handleBhimPayment}
                      variant="secondary"
                      className="w-full bg-white hover:bg-zinc-200 !text-black rounded-xl uppercase text-[10px] tracking-[0.2em] font-bold h-12 shadow-lg"
                      disabled={paymentLoading}
                    >
                      <QrCode className="h-4 w-4 mr-2" /> Show QR
                    </Button>
                    <Button
                      onClick={openUpiApp}
                      variant="ghost"
                      className="w-full border border-white/20 !text-white hover:bg-white/10 hover:!text-white rounded-xl uppercase text-[10px] tracking-[0.2em] font-bold h-12 backdrop-blur-sm"
                      disabled={paymentLoading}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> App
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col sm:flex-row items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/10"
                >
                  <div className="flex justify-center bg-white p-3 rounded-xl shadow-inner shrink-0">
                    <img
                      src={bhimConfig.qrCodeUrl}
                      alt="BHIM UPI QR Code"
                      className="w-32 h-32 rounded-lg"
                    />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-300">Scan with any UPI APP to pay</span>
                      <p className="font-mono text-xl font-bold text-white mt-1">{formatCurrency(total)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={verifyBhimPayment}
                        variant="secondary"
                        className="bg-white hover:bg-zinc-200 !text-black rounded-xl uppercase text-[10px] tracking-[0.2em] font-bold h-12 shadow-lg"
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                        ) : (
                          'I Have Paid'
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowQr(false)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl uppercase text-[10px] tracking-[0.2em] font-bold h-12 backdrop-blur-sm"
                        disabled={paymentLoading}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Razorpay - Gateway */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 relative shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1">
                <h4 className="font-serif text-2xl tracking-tight text-zinc-900 flex items-center gap-3 mb-4">
                  <div className="p-2 bg-zinc-100 rounded-full group-hover:bg-zinc-200 transition-colors">
                    <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  Cards & NetBanking
                </h4>

                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <span>Cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <span>NetBanking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                    <span>Wallets</span>
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-100 p-3 mt-4 rounded-xl flex items-center gap-3 inline-flex">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                    256-bit SSL encrypted connection
                  </p>
                </div>
              </div>

              <div className="sm:w-48 shrink-0">
                <Button
                  onClick={handleRazorpayPayment}
                  className="w-full h-14 bg-zinc-900 hover:bg-black !text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg shadow-zinc-900/20 transition-all hover:scale-[1.02]"
                  disabled={paymentLoading}
                >
                  {paymentLoading || !razorpayLoaded ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Pay {formatCurrency(total)}
                      <ArrowRight className="h-4 w-4 ml-2 bg-white/20 rounded-full p-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-zinc-100">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('logistics')} 
            className="flex-1 rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold h-14 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 transition-all hover:scale-[1.02]"
          >
            Back to Logistics
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden text-center py-6 sm:py-10 flex flex-col items-center min-h-[500px] justify-center"
    >
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }} />

      <motion.div 
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative z-10 shrink-0 w-24 h-24 rounded-full flex items-center justify-center mb-8"
        style={{ minWidth: '6rem', minHeight: '6rem', backgroundColor: '#10b981', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}
      >
        <div className="absolute inset-0 rounded-full border-2 scale-110 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ borderColor: 'rgba(16,185,129,0.3)' }} />
        <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 space-y-3 mb-10"
      >
        <h3 className="text-4xl font-serif tracking-tight text-zinc-900">
          {middlemanRequested ? 'Proposal Drafted' : 'Payment Successful'}
        </h3>
        <p className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.2em] text-zinc-500 max-w-sm mx-auto leading-relaxed px-4">
          {middlemanRequested ? 'Awaiting manufacturer approval. You will be notified shortly.' : 'Your order has been confirmed. A receipt has been sent to your email.'}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full max-w-sm mb-10 px-4 sm:px-0"
      >
        {/* Receipt Ticket Design */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-100 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #34d399, #10b981, #34d399)' }} />
          
          <div className="p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-2">Amount Paid</p>
            <p className="font-mono text-4xl font-bold text-black tracking-tighter">{formatCurrency(total)}</p>
            
            <div className="mt-8 space-y-4 border-t border-dashed border-zinc-200 pt-6">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                <span className="text-zinc-400">Order ID</span>
                <span className="text-zinc-800">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                <span className="text-zinc-400">Date</span>
                <span className="text-zinc-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                <span className="text-zinc-400">Payment</span>
                <span className="flex items-center gap-1.5" style={{ color: '#059669' }}><CheckCircle className="w-3.5 h-3.5" /> Secure</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 w-full max-w-sm px-4 sm:px-0"
      >
        <Button 
          onClick={handleClose} 
          className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-xl uppercase tracking-[0.2em] text-[10px] font-bold shadow-xl shadow-black/10 transition-all hover:scale-[1.02] group"
        >
          Return to Dashboard
          <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 'summary' && 'Order Summary'}
              {currentStep === 'location' && 'Delivery Details'}
              {currentStep === 'logistics' && 'Logistics Partner'}
              {currentStep === 'payment' && 'Payment'}
              {currentStep === 'success' && 'Order Placed!'}
            </DialogTitle>
            <DialogDescription>
              {currentStep === 'summary' && 'Review your order details before proceeding'}
              {currentStep === 'location' && 'Enter your delivery address'}
              {currentStep === 'logistics' && 'Choose a logistics partner for delivery'}
              {currentStep === 'payment' && 'Complete your payment'}
              {currentStep === 'success' && 'Your order has been successfully placed'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {/* Progress indicator - Typographic */}
            {currentStep !== 'success' && (
              <div className="flex items-center justify-center space-x-1 sm:space-x-3 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-300 mb-8 border-b border-zinc-100 pb-5 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <span className={`transition-colors flex-shrink-0 ${currentStep === 'summary' ? 'text-black' : currentStep === 'location' || currentStep === 'logistics' || currentStep === 'payment' ? 'text-zinc-800' : ''}`}>
                  01 <span className="hidden sm:inline">SUMMARY</span>
                </span>
                <span className="text-zinc-200 flex-shrink-0">&mdash;</span>
                <span className={`transition-colors flex-shrink-0 ${currentStep === 'location' ? 'text-black' : currentStep === 'logistics' || currentStep === 'payment' ? 'text-zinc-800' : ''}`}>
                  02 <span className="hidden sm:inline">LOCATION</span>
                </span>
                <span className="text-zinc-200 flex-shrink-0">&mdash;</span>
                <span className={`transition-colors flex-shrink-0 ${currentStep === 'logistics' ? 'text-black' : currentStep === 'payment' ? 'text-zinc-800' : ''}`}>
                  03 <span className="hidden sm:inline">LOGISTICS</span>
                </span>
                <span className="text-zinc-200 flex-shrink-0">&mdash;</span>
                <span className={`transition-colors flex-shrink-0 ${currentStep === 'payment' ? 'text-black' : ''}`}>
                  04 <span className="hidden sm:inline">PAYMENT</span>
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {currentStep === 'summary' && renderSummary()}
                {currentStep === 'location' && renderLocation()}
                {currentStep === 'logistics' && renderLogistics()}
                {currentStep === 'payment' && renderPayment()}
                {currentStep === 'success' && renderSuccess()}
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
