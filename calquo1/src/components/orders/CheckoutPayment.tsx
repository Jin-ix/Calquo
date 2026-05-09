import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Loader2,
  MapPin,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { toast } from 'sonner';

interface CheckoutPaymentProps {
  orderAmount: number;
  preferredAgentGst?: string | null;
  onPaymentComplete: (paymentMode: 'direct' | 'finance', financeAgentGst?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CheckoutPayment({ 
  orderAmount, 
  preferredAgentGst, 
  onPaymentComplete, 
  onCancel,
  isLoading = false
}: CheckoutPaymentProps) {
  const [paymentMode, setPaymentMode] = useState<'direct' | 'finance'>('direct');
  const [selectedAgentGst, setSelectedAgentGst] = useState<string>(preferredAgentGst || '');
  const [showAgentList, setShowAgentList] = useState(false);
  
  // Agent search state
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // If we have a preferred agent, and user selects finance, default to it
  // But if preferredAgentGst is present, we might want to pre-fetch their name to display
  const [preferredAgentName, setPreferredAgentName] = useState<string>('');

  useEffect(() => {
    if (preferredAgentGst) {
      // Try to fetch name (optional enhancement)
      // For now, we'll just display "My Preferred Agent" until fetched
    }
  }, [preferredAgentGst]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const q = query(
        collection(firebaseDb, 'users'), 
        where('role', '==', 'financial')
      );
      const snapshot = await getDocs(q);
      const agentList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          gst: data.gstNumber || data.profile?.gstNumber || 'UNKNOWN',
          companyName: data.company || data.company_name || data.name || 'Unknown Financial Agent',
          city: data.profile?.address?.city || data.city || 'India',
          state: data.profile?.address?.state || data.state || ''
        };
      });
      
      // Add mocks if needed
      if (agentList.length === 0) {
          agentList.push(
               { id: 'mock1', gst: '27FINBAJAJ123', companyName: 'Bajaj Finserv', city: 'Mumbai', state: 'MH' },
               { id: 'mock2', gst: '27FINHDFC456', companyName: 'HDFC Bank Credit', city: 'Mumbai', state: 'MH' }
          );
      }
      setAgents(agentList);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load financial agents");
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAgentSelect = (agent: any) => {
    setSelectedAgentGst(agent.gst);
    setShowAgentList(false);
    setPaymentMode('finance');
  };

  const handleSubmit = () => {
    if (paymentMode === 'finance' && !selectedAgentGst) {
      toast.error("Please select a financial agent");
      return;
    }
    
    onPaymentComplete(
      paymentMode, 
      paymentMode === 'finance' ? selectedAgentGst : undefined
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredAgents = agents.filter(agent => 
    agent.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment Method</span>
          <span className="text-xl font-bold text-slate-900">{formatCurrency(orderAmount)}</span>
        </CardTitle>
        <CardDescription>Select how you want to pay for this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={paymentMode} onValueChange={(val) => setPaymentMode(val as any)} className="space-y-4">
          
          {/* Option 1: Direct Payment */}
          <div className={`
            relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all cursor-pointer
            ${paymentMode === 'direct' ? 'border-green-600 bg-green-50/50' : 'border-slate-200 hover:border-slate-300'}
          `}
          onClick={() => setPaymentMode('direct')}
          >
            <RadioGroupItem value="direct" id="direct" className="mt-1" />
            <div className="grid gap-1.5 leading-none w-full">
              <Label htmlFor="direct" className="font-semibold text-base cursor-pointer">
                Pay Now (Direct)
              </Label>
              <p className="text-sm text-slate-500">
                Secure payment via UPI, Credit/Debit Card, or Netbanking.
              </p>
            </div>
            <Wallet className={`h-6 w-6 ${paymentMode === 'direct' ? 'text-green-600' : 'text-slate-400'}`} />
          </div>

          {/* Option 2: Finance via Preferred Agent */}
          {preferredAgentGst && (
            <div className={`
              relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all cursor-pointer
              ${paymentMode === 'finance' && selectedAgentGst === preferredAgentGst ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300'}
            `}
            onClick={() => {
              setPaymentMode('finance');
              setSelectedAgentGst(preferredAgentGst);
            }}
            >
              <RadioGroupItem value="finance" id="finance-pref" className="mt-1" checked={paymentMode === 'finance' && selectedAgentGst === preferredAgentGst} />
              <div className="grid gap-1.5 leading-none w-full">
                <Label htmlFor="finance-pref" className="font-semibold text-base cursor-pointer">
                  Pay Later - Credit
                </Label>
                <p className="text-sm text-slate-500">
                  Request credit from your preferred financial agent.
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-medium text-orange-700 bg-orange-100 w-fit px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" /> Preferred Agent Linked
                </div>
              </div>
              <CreditCard className={`h-6 w-6 ${paymentMode === 'finance' && selectedAgentGst === preferredAgentGst ? 'text-orange-500' : 'text-slate-400'}`} />
            </div>
          )}

          {/* Option 3: Choose Different Agent */}
          <Dialog open={showAgentList} onOpenChange={setShowAgentList}>
            <DialogTrigger asChild>
              <div className={`
                relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all cursor-pointer
                ${paymentMode === 'finance' && selectedAgentGst !== preferredAgentGst ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300'}
              `}
              onClick={() => {
                 setPaymentMode('finance'); // Select finance, but wait for agent selection
                 fetchAgents(); // Load agents when clicked
              }}
              >
                <div className="mt-1 h-4 w-4 rounded-full border border-primary ring-offset-background flex items-center justify-center">
                   {paymentMode === 'finance' && selectedAgentGst !== preferredAgentGst && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
                
                <div className="grid gap-1.5 leading-none w-full">
                  <Label className="font-semibold text-base cursor-pointer">
                    {selectedAgentGst && selectedAgentGst !== preferredAgentGst 
                      ? 'Selected: Another Agent' 
                      : preferredAgentGst ? 'Choose Different Financial Agent' : 'Select Financial Agent (Pay Later)'
                    }
                  </Label>
                  <p className="text-sm text-slate-500">
                    Browse and select a financial partner for credit terms.
                  </p>
                </div>
                <Building2 className={`h-6 w-6 ${paymentMode === 'finance' && selectedAgentGst !== preferredAgentGst ? 'text-orange-500' : 'text-slate-400'}`} />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Select Financial Agent</DialogTitle>
                <CardDescription>Choose a partner to finance this order</CardDescription>
              </DialogHeader>
              
              <div className="relative my-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search agents..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] space-y-2 pr-1">
                 {loadingAgents ? (
                   <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                 ) : filteredAgents.length > 0 ? (
                   filteredAgents.map(agent => (
                     <div 
                       key={agent.id}
                       onClick={() => handleAgentSelect(agent)}
                       className="flex items-center justify-between p-3 rounded-lg border hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors"
                     >
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-slate-600" />
                           </div>
                           <div>
                              <p className="font-medium text-slate-900">{agent.companyName}</p>
                              <p className="text-xs text-slate-500">{agent.city}, {agent.state}</p>
                           </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                     </div>
                   ))
                 ) : (
                   <p className="text-center text-slate-500 py-8">No agents found.</p>
                 )}
              </div>
            </DialogContent>
          </Dialog>

        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading} className="bg-slate-900 text-white hover:bg-slate-800">
          {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          {paymentMode === 'direct' ? 'Pay Now' : 'Submit Credit Request'}
        </Button>
      </CardFooter>
    </Card>
  );
}
