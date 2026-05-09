import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  CreditCard,
  Truck,
  Shield,
  Edit,
  Minus,
  Plus,
  Loader2,
  QrCode,
  ChevronRight
} from 'lucide-react';
import { EnhancedStockItem, getEffectivePrice } from '../stock/EnhancedStockTypes';
import { PatternDisplayComponent } from '../stock/PatternDisplayComponent';
import { SelectedCombination } from '../stock/ProductSelectionModal';
import { useAuth } from '../auth/AuthProvider';
import { useOrders } from '../context/OrderProvider';
import { toast } from 'sonner';
// @ts-ignore
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { collection, query, where as firestoreWhere, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';

interface LogisticsPartner {
  id: string;
  company: string;
  email: string;
  name?: string;
  mobile?: string;
}

interface PurchasePageProps {
  stock: EnhancedStockItem;
  selectedCombinations: SelectedCombination[];
  specialInstructions: string;
  onBack: () => void;
  onPurchaseComplete: () => void;
}

export function PurchasePage({
  stock,
  selectedCombinations,
  specialInstructions,
  onBack,
  onPurchaseComplete
}: PurchasePageProps) {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentInstructions, setCurrentInstructions] = useState(specialInstructions);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [editQuantities, setEditQuantities] = useState<{ [key: string]: number }>({});

  // Logistics Partner Selection
  const [logisticsPartners, setLogisticsPartners] = useState<LogisticsPartner[]>([]);
  const [selectedLogistics, setSelectedLogistics] = useState<string>('');
  const [logisticsLoading, setLogisticsLoading] = useState(true);
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'payment' | 'success'>('details');

  // Initialize edit quantities from selected combinations
  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {};
    selectedCombinations.forEach(item => {
      initialQuantities[item.combinationId] = item.quantity;
    });
    setEditQuantities(initialQuantities);
  }, [selectedCombinations]);

  // Load Logistics Partners
  useEffect(() => {
    let isMounted = true;
    const loadLogistics = async () => {
      setLogisticsLoading(true);
      try {
        const q = query(collection(firebaseDb, 'logistics-partners'), firestoreWhere('isActive', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (isMounted) {
            const partners = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as LogisticsPartner[];

            if (partners.length === 0) {
              // Fallback mock
              setLogisticsPartners([
                { id: 'mock1', company: 'Delhivery Standard', email: 'support@delhivery.com', name: 'Delhivery', mobile: '+91 9876543210' },
                { id: 'mock2', company: 'BlueDart Prime', email: 'care@bluedart.com', name: 'BlueDart', mobile: '+91 8765432109' }
              ]);
            } else {
              setLogisticsPartners(partners);
            }
            setLogisticsLoading(false);
          }
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error loading logistics partners:', error);
        if (isMounted) {
          setLogisticsPartners([
            { id: 'mock1', company: 'Delhivery Standard', email: 'support@delhivery.com', name: 'Delhivery', mobile: '+91 9876543210' },
            { id: 'mock2', company: 'BlueDart Prime', email: 'care@bluedart.com', name: 'BlueDart', mobile: '+91 8765432109' }
          ]);
          setLogisticsLoading(false);
        }
      }
    };

    loadLogistics();
    return () => { isMounted = false; };
  }, []);

  // Create maps for easy lookup
  const colorMap = new Map(stock.colors?.map(color => [color.id, color]) || []);
  const sizeMap = new Map(stock.sizes?.map(size => [size.id, size]) || []);

  const getTotalQuantity = () => {
    return Object.values(editQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    const effectivePrice = getEffectivePrice(stock) || 0;
    return getTotalQuantity() * effectivePrice;
  };

  const getEstimatedTax = () => {
    return Math.round(getTotalAmount() * 0.18); // 18% GST
  };

  const getFinalAmount = () => {
    return getTotalAmount() + getEstimatedTax();
  };

  const updateQuantity = (combinationId: string, newQuantity: number) => {
    const combination = stock.combinations?.find(c => c.id === combinationId);
    if (combination) {
      const clampedQuantity = Math.min(Math.max(1, newQuantity), combination.availableQuantity);
      setEditQuantities(prev => ({
        ...prev,
        [combinationId]: clampedQuantity
      }));
    }
  };

  const handleSubmitPurchase = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      return;
    }

    if (getTotalQuantity() === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    if (!selectedLogistics) {
      toast.error('Please select a logistics partner');
      return;
    }

    setPurchaseStep('payment');
  };

  const handleProcessPayment = async () => {
    const currentUser = user;
    if (!currentUser) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order object
      const orderData = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stockItem: stock,
        selectedCombinations: selectedCombinations.map(item => ({
          ...item,
          quantity: editQuantities[item.combinationId] || item.quantity
        })),
        specialInstructions: currentInstructions,
        deliveryAddress,
        preferredDeliveryDate,
        paymentMethod,
        totalQuantity: getTotalQuantity(),
        totalAmount: getFinalAmount(),
        baseAmount: getTotalAmount(),
        taxAmount: getEstimatedTax(),
        orderDate: new Date().toISOString(),
        status: 'pending',
        userInfo: {
          // @ts-ignore
          name: currentUser.user_metadata?.name || currentUser.email,
          email: currentUser.email,
          // @ts-ignore
          gstNumber: currentUser.user_metadata?.gst_number
        }
      };

      // Add to orders context
      await addOrder({
        ...orderData,
        itemName: stock.name,
        quantity: orderData.totalQuantity,
        unitPrice: getEffectivePrice(stock) || 0,
        // @ts-ignore
        buyerCompany: currentUser.user_metadata?.company || currentUser.email || 'Guest',
        supplierName: stock.supplier
      });

      setPurchaseStep('success');

      toast.success('Purchase request submitted successfully!', {
        description: 'The supplier will review your request and respond soon.'
      });

      // Navigate back and close
      setTimeout(() => {
        onPurchaseComplete();
      }, 1500);

    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to submit purchase request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetails = () => {
    if (!user) return null;

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white border-zinc-100 border p-6 mb-8 flex items-center gap-6">
            {stock.mainImages && stock.mainImages[0] && (
              <div className="w-24 h-24 bg-zinc-100 flex-shrink-0">
                <img
                  src={stock.mainImages[0]}
                  alt={stock.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{stock.name}</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                {stock.supplier}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Unit Basis</p>
              <p className="text-xl font-black">₹{(getEffectivePrice(stock) || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Items */}
              <Card className="bg-gradient-to-r from-white to-green-50/50 border border-green-200 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-white" />
                    </div>
                    Your Selected Items
                  </CardTitle>
                  <CardDescription>
                    Review and adjust quantities before placing your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {selectedCombinations.map(selected => {
                    const combination = stock.combinations?.find(c => c.id === selected.combinationId);
                    const size = sizeMap.get(selected.sizeId);
                    const color = colorMap.get(selected.colorId);
                    const currentQuantity = editQuantities[selected.combinationId] || selected.quantity;

                    return (
                      <div key={selected.combinationId} className="p-4 bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="default" className="bg-green-600 text-white">
                              {size?.displayName}
                            </Badge>
                            {color && (
                              <PatternDisplayComponent
                                pattern={color}
                                showDefinitionBadges={false}
                                size="sm"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {color?.name || 'Pattern'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                ₹{(getEffectivePrice(stock) || 0).toLocaleString()} / Piece
                              </span>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(selected.combinationId, currentQuantity - 1)}
                                disabled={currentQuantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={currentQuantity}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  updateQuantity(selected.combinationId, newValue);
                                }}
                                min="1"
                                max={combination?.availableQuantity}
                                className="h-8 w-16 text-center border-0 bg-transparent font-bold"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(selected.combinationId, currentQuantity + 1)}
                                disabled={currentQuantity >= (combination?.availableQuantity || 0)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <div className="text-lg font-bold text-green-600">
                                ₹{(currentQuantity * (getEffectivePrice(stock) || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Form Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Details */}
                <Card className="border border-zinc-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <Truck className="h-4 w-4 text-zinc-400" />
                      Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-address" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Address *</Label>
                      <Textarea
                        id="delivery-address"
                        placeholder="Enter complete delivery address..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={2}
                        className="resize-none text-sm rounded-none border-zinc-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred-date" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Preferred Date</Label>
                      <Input
                        id="preferred-date"
                        type="date"
                        value={preferredDeliveryDate}
                        onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                        className="text-sm rounded-none border-zinc-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Logistics Partner Selection */}
                <Card className="border border-zinc-200 bg-zinc-50/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      Logistics *
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {logisticsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {logisticsPartners.map(partner => (
                          <div
                            key={partner.id}
                            onClick={() => setSelectedLogistics(partner.id)}
                            className={`p-3 border transition-all cursor-pointer ${selectedLogistics === partner.id
                              ? 'border-black bg-white shadow-sm'
                              : 'border-zinc-200 bg-transparent opacity-60 hover:opacity-100'
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-tight">{partner.company}</p>
                                <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{partner.name || 'Partner'}</p>
                              </div>
                              {selectedLogistics === partner.id && (
                                <div className="w-2 h-2 bg-black rounded-full" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="border border-zinc-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      Method *
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['bank_transfer', 'cash_on_delivery', 'bhim_upi'].map(method => (
                        <label key={method} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`w-4 h-4 border flex items-center justify-center ${paymentMethod === method ? 'border-black' : 'border-zinc-300'}`}>
                            {paymentMethod === method && <div className="w-2 h-2 bg-black" />}
                          </div>
                          <input
                            type="radio"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-black transition-colors">
                            {method.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Instructions */}
                <Card className="border border-zinc-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-zinc-400" />
                        Notes
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingInstructions(!isEditingInstructions)}
                        className="text-[9px] font-black uppercase tracking-widest"
                      >
                        {isEditingInstructions ? 'Save' : 'Edit'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isEditingInstructions ? (
                      <Textarea
                        placeholder="Any special requirements..."
                        value={currentInstructions}
                        onChange={(e) => setCurrentInstructions(e.target.value)}
                        rows={2}
                        className="resize-none text-sm rounded-none border-zinc-200"
                      />
                    ) : (
                      <div className="p-3 bg-zinc-50 border border-dotted border-zinc-200 min-h-[60px]">
                        {currentInstructions ? (
                          <p className="text-[11px] text-zinc-600 leading-relaxed">{currentInstructions}</p>
                        ) : (
                          <p className="text-[10px] text-zinc-400 italic">No special instructions</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <Card className="border-none shadow-2xl bg-black text-white sticky top-4">
                <CardHeader className="p-8 border-b border-white/10">
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter">Bill Summary</CardTitle>
                  <CardDescription className="text-zinc-500 uppercase text-[9px] font-bold tracking-[0.3em]">Precision Commerce</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-zinc-500">Gross Items</span>
                      <span>{getTotalQuantity()} UNIT</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-zinc-500">Subtotal</span>
                      <span>₹{getTotalAmount().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-zinc-500">Tax (18%)</span>
                      <span>₹{getEstimatedTax().toLocaleString()}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-end py-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Net Total</span>
                      <span className="text-4xl font-black tracking-tighter">₹{getFinalAmount().toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitPurchase}
                    className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-[0.3em] text-[10px] transition-all"
                    disabled={isSubmitting || getTotalQuantity() === 0 || !deliveryAddress.trim()}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Authorize Request'}
                  </Button>

                  <div className="flex items-center gap-2 p-4 bg-white/5 opacity-50">
                    <Shield className="h-4 w-4" />
                    <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                      Transacting via Secure B2B Gateway
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPayment = () => (
    <div className="flex-1 flex items-center justify-center p-6 bg-white/50">
      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-black text-white p-8">
          <CardTitle className="text-2xl font-bold tracking-tight uppercase">Payment Portal</CardTitle>
          <CardDescription className="text-zinc-400">Complete your transaction to finalize order</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="p-6 bg-zinc-50 rounded-lg border border-zinc-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Amount Due</span>
              <span className="text-2xl font-bold">₹{getFinalAmount().toLocaleString()}</span>
            </div>
            <Separator className="bg-zinc-200" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Method</p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-none border-zinc-300 uppercase text-[9px] px-3">{paymentMethod.replace('_', ' ')}</Badge>
              </div>
            </div>
          </div>

          {paymentMethod === 'bhim_upi' ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-48 h-48 bg-white p-3 border-2 border-zinc-100 rounded-2xl shadow-inner flex items-center justify-center">
                <QrCode className="w-40 h-40 text-black" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-900 uppercase">Scan QR to Pay</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Secure gateway powered by Razorpay</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-900 text-white rounded-lg">
                <Shield className="h-6 w-6 text-zinc-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">Bank Details Revealed</p>
                  <p className="text-[10px] text-zinc-400">Standard NEFT/RTGS processing</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleProcessPayment}
            disabled={isSubmitting}
            className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150" />
        <div className="relative w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="space-y-3 max-w-sm">
        <h2 className="text-2xl font-bold uppercase tracking-tighter text-zinc-900">Purchase Request Logged</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-wide leading-relaxed">
          Your order has been broadcasted to the supplier and logistics partner. Check your dashboard for real-time tracking updates.
        </p>
      </div>
      <Button
        onClick={onPurchaseComplete}
        className="h-14 px-12 bg-black hover:bg-zinc-800 text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold"
      >
        Return to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center gap-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="rounded-none uppercase tracking-widest text-[9px] font-bold border border-zinc-200"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Cancel
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-900">
            {purchaseStep === 'details' ? 'Order Specification' : purchaseStep === 'payment' ? 'Security Layer' : 'Process Finalized'}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span className={purchaseStep === 'details' ? 'text-black' : ''}>Spec</span>
          <ChevronRight className="h-3 w-3" />
          <span className={purchaseStep === 'payment' ? 'text-black' : ''}>Pay</span>
          <ChevronRight className="h-3 w-3" />
          <span className={purchaseStep === 'success' ? 'text-black' : ''}>End</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={purchaseStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {purchaseStep === 'details' && renderDetails()}
          {purchaseStep === 'payment' && renderPayment()}
          {purchaseStep === 'success' && renderSuccess()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
