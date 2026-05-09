import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  Truck,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Loader2,
  DollarSign,
  FileText,
  Package,
  AlertCircle,
  Users
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { toast } from 'sonner';
import { PurchaseRequest } from '../../types/purchaseTypes';
import { purchaseService } from '../../utils/firebase/purchaseService';
import { useAuth } from '../auth/AuthProvider';

interface MultiStepCheckoutProps {
  request: PurchaseRequest;
  onComplete: (data: CheckoutData) => void;
  onCancel: () => void;
}

export interface CheckoutData {
  paymentMode: 'direct' | 'finance';
  logisticsAgentId: string;
  logisticsAgentName: string;
  logisticsAgentMobile?: string;
  financialAgentId?: string;
  financialAgentName?: string;
  specialInstructions?: string;
}

type Step = 1 | 2 | 3 | 4;

interface AgentData {
  id: string;
  name: string;
  mobile?: string;
  gst?: string;
  city?: string;
  state?: string;
}

export function MultiStepCheckout({ request, onComplete, onCancel }: MultiStepCheckoutProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Form data
  const [paymentMode, setPaymentMode] = useState<'direct' | 'finance'>('direct');
  const [logisticsAgentId, setLogisticsAgentId] = useState<string>('');
  const [logisticsAgentName, setLogisticsAgentName] = useState<string>('');
  const [logisticsAgentMobile, setLogisticsAgentMobile] = useState<string>('');
  const [financialAgentId, setFinancialAgentId] = useState<string>('');
  const [financialAgentName, setFinancialAgentName] = useState<string>('');

  // Agents
  const [logisticsAgents, setLogisticsAgents] = useState<AgentData[]>([]);
  const [financialAgents, setFinancialAgents] = useState<AgentData[]>([]);
  const [loadingLogistics, setLoadingLogistics] = useState(false);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [logisticsSearchTerm, setLogisticsSearchTerm] = useState('');
  const [financialSearchTerm, setFinancialSearchTerm] = useState('');

  // Debug: Log state on every render
  console.log('🔄 MultiStepCheckout RENDER:', {
    currentStep,
    loadingLogistics,
    logisticsAgentsCount: logisticsAgents.length,
    filteredCount: logisticsAgents.filter(agent =>
      agent.name.toLowerCase().includes(logisticsSearchTerm.toLowerCase()) ||
      agent.city?.toLowerCase().includes(logisticsSearchTerm.toLowerCase())
    ).length
  });

  // Fetch Logistics Agents when Step 2 is active
  useEffect(() => {
    if (currentStep !== 2) return;
    
    setLoadingLogistics(true);
    
    if (!firebaseDb) {
      console.error('🚫 Firebase DB not available');
      setLoadingLogistics(false);
      return;
    }

    console.log('🚚 ========== FETCHING LOGISTICS AGENTS ==========');
    
    // First, let's fetch ALL users to see what's available
    const allUsersRef = collection(firebaseDb, 'users');
    getDocs(allUsersRef).then((snapshot) => {
      console.log('📊 Total users in database:', snapshot.size);
      
      const logisticsAgentsList: AgentData[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const role = data.role || data.userRole || data.user_role;
        
        console.log(`👤 User ${doc.id}:`, {
          role: role,
          company: data.company_name || data.company || data.owner_name,
          rawRole: data.role,
          rawUserRole: data.userRole,
          rawUser_role: data.user_role
        });
        
        // Check for logistics agent role (support multiple variations)
        const isLogistics = role === 'logistics_agent' || 
                           role === 'logistics-agent' || 
                           role === 'logistics' ||
                           data.role === 'logistics_agent' ||
                           data.role === 'logistics-agent' ||
                           data.userRole === 'logistics_agent' ||
                           data.userRole === 'logistics-agent' ||
                           data.user_role === 'logistics_agent' ||
                           data.user_role === 'logistics-agent';
        
        if (isLogistics) {
          console.log('✅ Found logistics agent:', doc.id, data.company_name || data.company || data.owner_name);
          logisticsAgentsList.push({
            id: doc.id,
            name: data.company_name || data.company || data.owner_name || data.displayName || 'Unnamed Agent',
            mobile: data.mobile || data.mobile_number || '',
            gst: data.gstNumber || data.profile?.gstNumber || 'N/A',
            city: data.city || data.profile?.address?.city || '',
            state: data.state || data.profile?.address?.state || ''
          });
        }
      });
      
      console.log('🎯 RESULT: Found', logisticsAgentsList.length, 'logistics agents');
      console.log('📦 Setting state with agents:', logisticsAgentsList);
      setLogisticsAgents(logisticsAgentsList);
      setLoadingLogistics(false);
      console.log('✅ State updated - loadingLogistics set to FALSE');
    }).catch((error) => {
      console.error('❌ Error loading logistics agents:', error);
      toast.error('Failed to load logistics agents');
      setLoadingLogistics(false);
    });
  }, [currentStep]);

  // Fetch Financial Agents when Step 3 is active and payment mode is 'finance'
  useEffect(() => {
    if (currentStep !== 3 || paymentMode !== 'finance') return;
    
    setLoadingFinancial(true);
    
    if (!firebaseDb) {
      console.error('🚫 Firebase DB not available');
      setLoadingFinancial(false);
      return;
    }

    console.log('💳 ========== FETCHING FINANCIAL AGENTS ==========');
    
    // Fetch ALL users to see what's available
    const allUsersRef = collection(firebaseDb, 'users');
    getDocs(allUsersRef).then((snapshot) => {
      console.log('📊 Total users in database:', snapshot.size);
      
      const financialAgentsList: AgentData[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const role = data.role || data.userRole || data.user_role;
        
        // Check for financial agent role (support multiple variations)
        const isFinancial = role === 'financial_agent' || 
                           role === 'financial-agent' || 
                           role === 'financial' ||
                           data.role === 'financial_agent' ||
                           data.role === 'financial-agent' ||
                           data.role === 'financial' ||
                           data.userRole === 'financial_agent' ||
                           data.userRole === 'financial-agent' ||
                           data.userRole === 'financial' ||
                           data.user_role === 'financial_agent' ||
                           data.user_role === 'financial-agent' ||
                           data.user_role === 'financial';
        
        if (isFinancial) {
          console.log('✅ Found financial agent:', doc.id, data.company_name || data.company || data.owner_name);
          financialAgentsList.push({
            id: doc.id,
            name: data.company_name || data.company || data.owner_name || data.displayName || 'Unnamed Agent',
            mobile: data.mobile || data.mobile_number || '',
            gst: data.gstNumber || data.profile?.gstNumber || 'N/A',
            city: data.city || data.profile?.address?.city || '',
            state: data.state || data.profile?.address?.state || ''
          });
        }
      });
      
      console.log('🎯 RESULT: Found', financialAgentsList.length, 'financial agents');
      setFinancialAgents(financialAgentsList);
      setLoadingFinancial(false);
    }).catch((error) => {
      console.error('❌ Error loading financial agents:', error);
      toast.error('Failed to load financial agents');
      setLoadingFinancial(false);
    });
  }, [currentStep, paymentMode]);

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!paymentMode) {
        toast.error('Please select a payment mode');
        return;
      }
    } else if (currentStep === 2) {
      if (!logisticsAgentId) {
        toast.error('Please select a logistics agent');
        return;
      }
    } else if (currentStep === 3) {
      // Skip financial agent step if payment mode is 'direct'
      if (paymentMode === 'direct') {
        setCurrentStep(4);
        return;
      }
      // Validate financial agent if payment mode is 'finance'
      if (paymentMode === 'finance' && !financialAgentId) {
        toast.error('Please select a financial agent');
        return;
      }
    }
    
    setCurrentStep((currentStep + 1) as Step);
  };

  const handleBack = () => {
    // Skip financial agent step when going back if payment mode is 'direct'
    if (currentStep === 4 && paymentMode === 'direct') {
      setCurrentStep(2);
      return;
    }
    setCurrentStep((currentStep - 1) as Step);
  };

  const handleLogisticsSelect = (agent: AgentData) => {
    setLogisticsAgentId(agent.id);
    setLogisticsAgentName(agent.name);
    setLogisticsAgentMobile(agent.mobile || '');
  };

  const handleFinancialSelect = (agent: AgentData) => {
    setFinancialAgentId(agent.id);
    setFinancialAgentName(agent.name);
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare purchase request data
      const requestData = {
        ...request,
        paymentMode,
        logisticsAgentId,
        logisticsAgentName,
        logisticsAgentMobile,
        financialAgentId: paymentMode === 'finance' ? financialAgentId : undefined,
        financialAgentName: paymentMode === 'finance' ? financialAgentName : undefined,
        status: 'pending_multi_party_approval' as const,
        sellerApproval: 'pending' as const,
        logisticsApproval: 'pending' as const,
        financialApproval: paymentMode === 'finance' ? ('pending' as const) : undefined
      };

      // Remove temporary fields
      const { id, createdAt, updatedAt, ...dataToCreate } = requestData;

      // Create the purchase request in Firestore
      const requestId = await purchaseService.createRequest(dataToCreate);

      console.log('✅ Purchase request created with ID:', requestId);

      toast.success('Purchase request sent successfully! All parties will be notified.');
      
      const checkoutData: CheckoutData = {
        paymentMode,
        logisticsAgentId,
        logisticsAgentName,
        logisticsAgentMobile,
        financialAgentId: paymentMode === 'finance' ? financialAgentId : undefined,
        financialAgentName: paymentMode === 'finance' ? financialAgentName : undefined,
        specialInstructions: request.specialInstructions
      };

      onComplete(checkoutData);
    } catch (error: any) {
      console.error('Error submitting purchase request:', error);
      toast.error('Failed to submit request: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogistics = logisticsAgents.filter(agent =>
    agent.name.toLowerCase().includes(logisticsSearchTerm.toLowerCase()) ||
    agent.city?.toLowerCase().includes(logisticsSearchTerm.toLowerCase())
  );

  const filteredFinancial = financialAgents.filter(agent =>
    agent.name.toLowerCase().includes(financialSearchTerm.toLowerCase()) ||
    agent.city?.toLowerCase().includes(financialSearchTerm.toLowerCase())
  );

  // Determine which steps to show
  const steps = [
    { number: 1, label: 'Payment Mode', icon: CreditCard },
    { number: 2, label: 'Logistics Agent', icon: Truck },
    ...(paymentMode === 'finance' ? [{ number: 3, label: 'Financial Agent', icon: Building2 }] : []),
    { number: 4, label: 'Review & Submit', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${isActive ? 'border-blue-600 bg-blue-600 text-white' : ''}
                  ${isCompleted ? 'border-green-600 bg-green-600 text-white' : ''}
                  ${!isActive && !isCompleted ? 'border-gray-300 bg-white text-gray-400' : ''}
                `}>
                  {isCompleted ? <Check className="h-6 w-6" /> : <span className="font-semibold">{step.number}</span>}
                </div>
                <div className="flex items-center gap-1 mt-2 text-center">
                  <StepIcon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 -mt-6 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Payment Mode Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Choose Payment Mode</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select how you want to handle payment for this order
                </p>
              </div>

              <RadioGroup value={paymentMode} onValueChange={(val) => setPaymentMode(val as 'direct' | 'finance')}>
                <div 
                  className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                    paymentMode === 'direct' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMode('direct')}
                >
                  <RadioGroupItem value="direct" id="direct" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="direct" className="font-semibold cursor-pointer">
                        Direct Payment
                      </Label>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                        Pay Online
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pay directly via UPI, Cards, Net Banking, or Wallets after all approvals
                    </p>
                  </div>
                  <DollarSign className={`h-6 w-6 ${paymentMode === 'direct' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>

                <div 
                  className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                    paymentMode === 'finance' ? 'border-orange-600 bg-orange-50/50' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMode('finance')}
                >
                  <RadioGroupItem value="finance" id="finance" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="finance" className="font-semibold cursor-pointer">
                      Through Financial Agent
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Let a financial agent handle payment processing and credit management
                    </p>
                  </div>
                  <Building2 className={`h-6 w-6 ${paymentMode === 'finance' ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Logistics Agent Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Select Logistics Agent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a logistics partner to handle delivery <span className="text-red-500">*</span>
                </p>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logistics agents by name or city..."
                  value={logisticsSearchTerm}
                  onChange={(e) => setLogisticsSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingLogistics ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredLogistics.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
                  <Truck className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-muted-foreground">No logistics agents found</p>
                </div>
              ) : (
                <RadioGroup value={logisticsAgentId} onValueChange={(id) => {
                  const agent = logisticsAgents.find(a => a.id === id);
                  if (agent) handleLogisticsSelect(agent);
                }}>
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-2">
                      {filteredLogistics.map((agent) => (
                        <div 
                          key={agent.id}
                          className={`flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                            logisticsAgentId === agent.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'
                          }`}
                          onClick={() => handleLogisticsSelect(agent)}
                        >
                          <RadioGroupItem value={agent.id} id={agent.id} className="mt-1" />
                          <Label htmlFor={agent.id} className="flex-1 cursor-pointer">
                            <div className="font-semibold text-gray-900">{agent.name}</div>
                            {agent.city && <div className="text-sm text-muted-foreground mt-0.5">📍 {agent.city}, {agent.state}</div>}
                            {agent.gst && <div className="text-xs text-muted-foreground mt-0.5">GST: {agent.gst}</div>}
                            {agent.mobile && <div className="text-xs text-muted-foreground mt-0.5">📞 {agent.mobile}</div>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Step 3: Financial Agent Selection (Only if paymentMode === 'finance') */}
          {currentStep === 3 && paymentMode === 'finance' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Select Financial Agent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a financial agent to handle payment processing <span className="text-red-500">*</span>
                </p>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search financial agents by name or city..."
                  value={financialSearchTerm}
                  onChange={(e) => setFinancialSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingFinancial ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredFinancial.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
                  <Building2 className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-muted-foreground">No financial agents found</p>
                </div>
              ) : (
                <RadioGroup value={financialAgentId} onValueChange={(id) => {
                  const agent = financialAgents.find(a => a.id === id);
                  if (agent) handleFinancialSelect(agent);
                }}>
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-2">
                      {filteredFinancial.map((agent) => (
                        <div 
                          key={agent.id}
                          className={`flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                            financialAgentId === agent.id ? 'border-orange-600 bg-orange-50/50' : 'border-gray-200'
                          }`}
                          onClick={() => handleFinancialSelect(agent)}
                        >
                          <RadioGroupItem value={agent.id} id={agent.id} className="mt-1" />
                          <Label htmlFor={agent.id} className="flex-1 cursor-pointer">
                            <div className="font-semibold text-gray-900">{agent.name}</div>
                            {agent.city && <div className="text-sm text-muted-foreground mt-0.5">📍 {agent.city}, {agent.state}</div>}
                            {agent.gst && <div className="text-xs text-muted-foreground mt-0.5">GST: {agent.gst}</div>}
                            {agent.mobile && <div className="text-xs text-muted-foreground mt-0.5">📞 {agent.mobile}</div>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Review & Send Purchase Request</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review details before sending to seller, logistics agent{paymentMode === 'finance' && ', and financial agent'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Order Items */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Order Items</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{request.stockName}</p>
                          <p className="text-sm text-muted-foreground">Supplier: {request.sellerCompany || request.sellerName}</p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="text-left p-2 font-semibold">Variant</th>
                              <th className="text-right p-2 font-semibold">Qty</th>
                              <th className="text-right p-2 font-semibold">Price/Unit</th>
                              <th className="text-right p-2 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {request.items.map((item, index) => (
                              <tr key={index}>
                                <td className="p-2">
                                  <span className="text-gray-700">
                                    {item.colorId && item.sizeId ? `${item.sizeId} • ${item.colorId}` : item.combinationId}
                                  </span>
                                </td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">₹{item.pricePerUnit.toLocaleString()}</td>
                                <td className="p-2 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="font-semibold text-gray-900">Total Quantity</span>
                        <span className="font-semibold text-gray-900">{request.totalQuantity} units</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Grand Total</span>
                        <span className="text-xl font-bold text-blue-700">₹{request.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Instructions */}
                {request.specialInstructions && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold">Special Instructions</h4>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.specialInstructions}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Mode */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Payment Mode</h4>
                    </div>
                    <Badge variant="secondary" className={paymentMode === 'direct' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-orange-100 text-orange-700 border-orange-300'}>
                      {paymentMode === 'direct' ? 'DIRECT PAYMENT' : 'THROUGH FINANCIAL AGENT'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {paymentMode === 'direct' 
                        ? 'You will pay online after all parties approve this request'
                        : 'Financial agent will handle payment processing'}
                    </p>
                  </CardContent>
                </Card>

                {/* Logistics Agent */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Logistics Agent</h4>
                    </div>
                    <p className="font-medium text-gray-900">{logisticsAgentName}</p>
                    {logisticsAgentMobile && (
                      <p className="text-xs text-muted-foreground mt-1">📞 {logisticsAgentMobile}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Agent */}
                {paymentMode === 'finance' && financialAgentId && financialAgentName && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold">Financial Agent</h4>
                      </div>
                      <p className="font-medium text-gray-900">{financialAgentName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This agent will handle payment processing for your order
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Approval Process Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Users className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Multi-Party Approval Process</p>
                      <p className="mb-2">
                        This request will be sent to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Seller:</strong> {request.sellerCompany || request.sellerName}</li>
                        <li><strong>Logistics Agent:</strong> {logisticsAgentName}</li>
                        {paymentMode === 'finance' && financialAgentName && (
                          <li><strong>Financial Agent:</strong> {financialAgentName}</li>
                        )}
                      </ul>
                      <p className="mt-2">
                        <strong>Important:</strong> If seller or financial agent rejects, the order will be cancelled. 
                        If logistics agent rejects, you can select another logistics partner.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg bg-white">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a> and 
                    confirm that all the information provided is accurate. I understand that this purchase request 
                    requires approval from all selected parties.
                  </Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button 
          onClick={currentStep === 4 ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Request...
            </>
          ) : currentStep === 4 ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Send Purchase Request
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
