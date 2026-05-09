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
    // Create order
    try {
      const rawOrderData = {
        buyerId: user?.email || '',
        // @ts-ignore
        buyer_name: user?.businessName || user?.fullName || '',
        buyer_company: user?.company || '',
        buyer_phone: contactPhone,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          color: item.color || null,
          size: item.size || null,
          sku: item.sku || null,
          quantity: item.quantity,
          price_per_unit: item.price,
          total: item.price * item.quantity,
          image: item.image || null
        })),
        subtotal,
        gst,
        total,
        delivery_city: deliveryCity,
        delivery_address: deliveryAddress,
        delivery_pincode: deliveryPincode,
        delivery_state: deliveryState,
        logistics_agent_id: selectedAgentId || null,
        logistics_agent_name: selectedAgent?.name || null,
        special_instructions: specialInstructions || null,
        status: middlemanRequested ? 'pending_seller_approval' : 'pending',
        payment_status: 'pending',
        // Middleman fields (Consensus Protocol)
        proposed_middleman_id: proposedMiddlemanId || null, // Selected in the Directory drawer
        proposing_party: middlemanRequestedBy || null,
        agreed_middleman_id: null,
        escrow_status: middlemanRequested ? 'negotiating_agent' : 'not_requested',
        middleman_fee_payer: middlemanFeePayer || null,
        middleman_city: initialDestinationCity || null,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Strip all undefined properties recursively or cleanly map them to null as done above
      const orderData = JSON.parse(JSON.stringify(rawOrderData));

      const newOrderId = await addDocument('orders', orderData);

      if (!newOrderId) {
        throw new Error('Failed to generate order ID');
      }

      setOrderId(newOrderId);

      if (middlemanRequested) {
        toast.success('Proposal Drafted! Sent to manufacturer for review.');
        setCurrentStep('success'); // Skip payment for now while in negotiation
        onSuccess?.();
      } else {
        toast.success('Order created! Proceeding to payment...');
        setCurrentStep('payment');
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const handlePaymentSuccess = async (
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    try {
      // Update order status
      await updateDocument('orders', orderId, {
        payment_status: 'paid',
        status: 'confirmed',
        payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Add payment record
      await addDocument(`orders/${orderId}/payments`, {
        payment_id: razorpayPaymentId,
        order_id: razorpayOrderId,
        signature: razorpaySignature,
        amount: total,
        method: 'razorpay',
        status: 'success',
        createdAt: new Date().toISOString()
      });

      setPaymentId(razorpayPaymentId);
      setShowPayment(false);
      setCurrentStep('success');
      toast.success('Payment successful!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Payment completed but failed to update order. Please contact support.');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <h3 className="text-2xl font-serif tracking-tight text-zinc-900">Order Summary</h3>
        <Badge variant="secondary" className="font-mono text-[10px] tracking-widest uppercase bg-zinc-100 text-zinc-600 rounded-none border border-zinc-200">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {/* Items List */}
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {items.map((item, index) => {
          const itemImageUrl = resolveImageUrl(item.image);
          return (
            <div key={index} className="flex gap-4 p-4 border border-zinc-200 bg-white group hover:border-zinc-400 transition-colors">
              {itemImageUrl ? (
                <img
                  src={itemImageUrl}
                  alt={item.name}
                  className="w-20 h-20 object-cover bg-zinc-50 transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-20 h-20 bg-zinc-50 flex flex-col items-center justify-center border border-zinc-100 text-zinc-300">
                  <Package className="h-6 w-6 opacity-20" strokeWidth={1} />
                  <span className="text-[8px] uppercase tracking-widest mt-1 opacity-40">No Image</span>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="font-serif text-lg text-zinc-900 truncate tracking-tight">{item.name}</p>
                  {(item.color || item.size) && (
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mt-1">
                      {item.color && <span>{item.color}</span>}
                      {item.color && item.size && <span> / </span>}
                      {item.size && <span>{item.size}</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Qty: {item.quantity}</span>
                  <span className="font-serif text-lg text-zinc-900">{(item.price * item.quantity).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="bg-zinc-200" />

      {/* Price Breakdown */}
      <div className="space-y-3 bg-zinc-50 p-6 border border-zinc-200">
        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-500">
          <span>Subtotal</span>
          <span className="text-zinc-900">{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-500">
          <span>GST (18%)</span>
          <span className="text-zinc-900">{gst.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
        </div>
        <Separator className="bg-zinc-200 my-2" />
        <div className="flex justify-between font-serif text-2xl text-zinc-900">
          <span>Total</span>
          <span>{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
        </div>
      </div>

      <Button onClick={handleSummaryNext} className="w-full h-14 bg-black hover:bg-zinc-900 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold transition-all hover:scale-[1.01] gap-2 mt-4">
        Continue to Delivery
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderLocation = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Delivery Location</h3>
        </div>

        {/* Show current company location */}
        {companyAddress && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Your Company Location</p>
                  <p className="text-sm text-blue-700 mt-1">{companyAddress}</p>
                  <p className="text-sm text-blue-700">
                    {companyCity}{companyState && `, ${companyState}`} - {companyPincode}
                  </p>
                  {companyPhone && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-blue-700">
                      <Phone className="h-3 w-3" />
                      <span>{companyPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div>
            <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-4 block">Delivery Location Option</Label>
            <RadioGroup value={useCompanyLocation} onValueChange={(value: string) => setUseCompanyLocation(value as 'yes' | 'no')} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`flex flex-col border p-5 transition-all outline-none ${!companyAddress ? 'opacity-50 border-zinc-200' : useCompanyLocation === 'yes' ? 'border-black bg-black text-white shadow-md' : 'border-zinc-200 hover:border-zinc-400 cursor-pointer text-zinc-900 bg-white'}`}>
                <RadioGroupItem value="yes" id="yes" disabled={!companyAddress} className="sr-only" />
                <Label htmlFor="yes" className={`flex-1 flex flex-col items-start ${companyAddress ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <span className={`font-serif text-xl tracking-tight block mb-2 ${useCompanyLocation === 'yes' ? 'text-white' : 'text-zinc-900'}`}>Company</span>
                  <span className={`text-[10px] uppercase tracking-wider font-medium leading-relaxed ${useCompanyLocation === 'yes' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {companyAddress ? 'Deliver to your registered address' : 'No company address available'}
                  </span>
                </Label>
              </div>

              <div className={`flex flex-col border p-5 transition-all outline-none ${useCompanyLocation === 'no' ? 'border-black bg-black text-white shadow-md' : 'border-zinc-200 hover:border-zinc-400 cursor-pointer text-zinc-900 bg-white'}`}>
                <RadioGroupItem value="no" id="no" className="sr-only" />
                <Label htmlFor="no" className="flex-1 flex flex-col items-start cursor-pointer">
                  <span className={`font-serif text-xl tracking-tight block mb-2 ${useCompanyLocation === 'no' ? 'text-white' : 'text-zinc-900'}`}>Custom</span>
                  <span className={`text-[10px] uppercase tracking-wider font-medium leading-relaxed ${useCompanyLocation === 'no' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Enter a different delivery address
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Show company location details when selected */}
          {useCompanyLocation === 'yes' && companyAddress && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Delivery will be sent to:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCompanyLocation('no')}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Change
                </Button>
              </div>

              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{companyAddress}</p>
                        <p className="text-muted-foreground">
                          {companyCity}{companyState && `, ${companyState}`} - {companyPincode}
                        </p>
                      </div>
                    </div>
                    {companyPhone && (
                      <div className="flex items-center gap-2 pt-1">
                        <Phone className="h-4 w-4 text-primary" />
                        <p className="font-medium">{companyPhone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {useCompanyLocation === 'no' && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">Enter new delivery location:</p>

              <div>
                <Label htmlFor="city">City *</Label>
                <Select value={deliveryCity} onValueChange={setDeliveryCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJOR_INDIAN_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
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
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="Enter state"
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Contact Phone *</Label>
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
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('summary')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleLocationNext} className="flex-1 gap-2">
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderLogistics = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <Truck className="h-6 w-6 text-zinc-900" strokeWidth={1.5} />
          <h3 className="text-2xl font-serif tracking-tight text-zinc-900">Select Logistics Partner</h3>
        </div>

        {filteredAgents.length > 0 ? (
          <RadioGroup value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className={`border p-5 transition-all outline-none ${selectedAgentId === agent.id ? 'border-black bg-black text-white shadow-md' : 'border-zinc-200 hover:border-zinc-400 cursor-pointer bg-white text-zinc-900'}`}>
                  <label htmlFor={agent.id} className="flex items-start gap-4 cursor-pointer w-full">
                    <RadioGroupItem value={agent.id} id={agent.id} className="sr-only" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-serif text-xl tracking-tight ${selectedAgentId === agent.id ? 'text-white' : 'text-zinc-900'}`}>{agent.name}</p>
                        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1">
                          <Star className={`h-3 w-3 ${selectedAgentId === agent.id ? 'fill-white text-white' : 'fill-zinc-900 text-zinc-900'}`} />
                          <span className={`text-[10px] font-bold tracking-widest ${selectedAgentId === agent.id ? 'text-white' : 'text-zinc-900'}`}>{(agent.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 mt-2 text-[10px] uppercase tracking-widest font-medium ${selectedAgentId === agent.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <Phone className="h-3 w-3" />
                        <span>{agent.mobileNumber}</span>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-[10px] uppercase tracking-widest font-medium ${selectedAgentId === agent.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <MapPin className="h-3 w-3" />
                        <span>
                          {agent.serviceArea.type === 'all-india'
                            ? 'All India Coverage'
                            : `${agent.serviceArea.cities?.length || 0} Cities Selected`}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <Alert className="rounded-none border-zinc-200 bg-zinc-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-zinc-600 text-xs uppercase tracking-widest">
              No logistics partners available for {deliveryCity}. You can proceed without selecting an agent and we'll arrange logistics for you.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          <Label htmlFor="instructions" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2 block">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="Any special delivery instructions..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
            className="rounded-none border-zinc-200 focus-visible:ring-black"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setCurrentStep('location')} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleLogisticsNext}
            className="flex-1 bg-black hover:bg-zinc-900 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold h-12"
            disabled={!selectedAgentId}
          >
            {middlemanRequested ? 'Draft Proposal' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    );
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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
      <div className="space-y-8">
        {/* Order Summary - Dense & Editorial */}
        <div className="bg-zinc-50 border border-zinc-200 p-6">
          <h3 className="font-serif text-lg mb-4 text-zinc-900 flex items-center justify-between border-b border-zinc-200 pb-2">
            <span>Order Overview</span>
            <span className="font-mono text-sm">{formatCurrency(total)}</span>
          </h3>
          <div className="space-y-2 text-[10px] uppercase tracking-widest font-medium">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-zinc-600">
                <span className="truncate pr-4 text-zinc-900">
                  {item.quantity} × {item.name}
                </span>
                <span className="whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Title */}
        <div>
          <h3 className="font-serif text-2xl tracking-tight text-zinc-900 mb-1">Select Payment</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Secure encrypted transaction</p>
        </div>

        {/* Payment Methods Grid - High Contrast */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* BHIM UPI - Highlighted */}
          <div className="border border-black bg-black text-white p-6 relative group transition-all">
            <div className="absolute top-4 right-4 bg-white text-black px-2 py-1 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1">
              <Zap className="h-3 w-3" strokeWidth={2} /> Recommended
            </div>
            <h4 className="font-serif text-xl tracking-tight flex items-center gap-2 mb-6">
              <Smartphone className="h-5 w-5" strokeWidth={1.5} />
              BHIM UPI
            </h4>

            <div className="space-y-6">
              {!showQr ? (
                <>
                  <div className="space-y-3 text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-white" strokeWidth={1.5} />
                      <span>Zero transaction fees</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-white" strokeWidth={1.5} />
                      <span>Instant verification</span>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 p-4">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1.5">UPI Virtual Address:</p>
                    <div className="font-mono text-sm text-white">
                      {bhimConfig.vpa}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Button
                      onClick={handleBhimPayment}
                      className="bg-white hover:bg-zinc-200 text-black rounded-none uppercase text-[10px] tracking-[0.2em] font-bold h-12"
                      disabled={paymentLoading}
                    >
                      <QrCode className="h-4 w-4 mr-2" /> Show QR
                    </Button>
                    <Button
                      onClick={openUpiApp}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-none uppercase text-[10px] tracking-[0.2em] font-bold h-12"
                      disabled={paymentLoading}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> App
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center bg-white p-4">
                    <img
                      src={bhimConfig.qrCodeUrl}
                      alt="BHIM UPI QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="bg-white/10 p-3 text-center border border-white/20">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-300">Scan with any UPI APP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={verifyBhimPayment}
                      className="bg-white hover:bg-zinc-200 text-black rounded-none uppercase text-[10px] tracking-[0.2em] font-bold h-12"
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'I Have Paid'
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowQr(false)}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-none uppercase text-[10px] tracking-[0.2em] font-bold h-12"
                      disabled={paymentLoading}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Razorpay - Gateway */}
          <div className="border border-zinc-200 bg-white p-6 relative flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-xl tracking-tight text-zinc-900 flex items-center gap-2 mb-6">
                <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                Cards & NetBanking
              </h4>

              <div className="space-y-4 text-[10px] uppercase tracking-widest font-medium text-zinc-500">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                  <span>Major Credit & Debit Cards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4" strokeWidth={1.5} />
                  <span>60+ Supported Banks</span>
                </div>
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4" strokeWidth={1.5} />
                  <span>Digital Wallets</span>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 mt-6">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-zinc-900 mt-0.5" strokeWidth={1.5} />
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                    256-bit SSL encrypted connection powered by Razorpay.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleRazorpayPayment}
                className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold"
                disabled={paymentLoading || !razorpayLoaded}
              >
                {paymentLoading || !razorpayLoaded ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Pay {formatCurrency(total)}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('logistics')} className="flex-1 rounded-none uppercase tracking-widest text-[10px] font-bold h-12">
            Back
          </Button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="text-center py-12 space-y-8 flex flex-col items-center">
      <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center">
        <CheckCircle className="h-10 w-10" strokeWidth={1.5} />
      </div>

      <div>
        <h3 className="text-4xl font-serif tracking-tight text-zinc-900 mb-3">
          {middlemanRequested ? 'Proposal Drafted.' : 'Order Confirmed.'}
        </h3>
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500">
          {middlemanRequested ? 'Awaiting manufacturer approval' : 'Your transaction was successful'}
        </p>
      </div>

      <div className="bg-white p-4">
        <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Total Authorized</p>
        <p className="font-serif text-lg">{formatCurrency(total)}</p>
      </div>

      <Button onClick={handleClose} className="w-full max-w-sm h-14 bg-black hover:bg-zinc-900 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold">
        Return to Dashboard
      </Button>
    </div>
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
