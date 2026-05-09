import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Key,
  Server,
  Activity
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { RAZORPAY_CONFIG } from '../../config/razorpay';
import { toast } from 'sonner';

export function RazorpayDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    frontend: 'ok' | 'error' | 'pending';
    backend: 'ok' | 'error' | 'pending';
    razorpay: 'ok' | 'error' | 'pending';
    message?: string;
  }>({
    frontend: 'pending',
    backend: 'pending',
    razorpay: 'pending'
  });

  const checkStatus = async () => {
    setLoading(true);
    setStatus({ frontend: 'pending', backend: 'pending', razorpay: 'pending' });

    // 1. Check Frontend Configuration
    const hasKeyId = RAZORPAY_CONFIG.keyId && RAZORPAY_CONFIG.keyId !== 'UNCONFIGURED' && RAZORPAY_CONFIG.keyId !== 'rzp_test_YOUR_KEY_ID';
    const isDemo = RAZORPAY_CONFIG.demoMode;
    
    setStatus(prev => ({ 
      ...prev, 
      frontend: hasKeyId ? 'ok' : 'error' 
    }));

    if (!hasKeyId) {
      toast.error('Frontend Key ID missing or using placeholder');
    }

    // 2. Check Backend Connection & Razorpay Order Creation
    try {
      const functions = getFunctions();
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      
      // Attempt a small test order (1 INR)
      const result = await createOrder({
        amount: 1,
        currency: 'INR',
        receipt: `test_diag_${Date.now()}`,
        notes: { diagnostic: true }
      });

      const data = result.data as any;
      
      if (data.success && data.orderId) {
        setStatus(prev => ({ 
          ...prev, 
          backend: 'ok',
          razorpay: 'ok',
          message: `Connection successful! Test Order ID: ${data.orderId}`
        }));
        toast.success('Razorpay connection verified successfully!');
      } else {
        throw new Error(data.message || 'Failed to create test order');
      }
    } catch (error: any) {
      console.error('Razorpay Diagnostic Error:', error);
      
      // Check if it's a configuration error
      const isConfigError = error.message?.includes('not configured') || error.code === 'internal';
      
      setStatus(prev => ({ 
        ...prev, 
        backend: 'ok', // Function exists
        razorpay: 'error',
        message: error.message || 'Connection failed'
      }));
      
      toast.error(error.message || 'Failed to verify Razorpay connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-teal-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Razorpay Gateway Diagnostic
            </CardTitle>
            <CardDescription>
              Verify your API keys and backend connectivity
            </CardDescription>
          </div>
          <Badge variant={RAZORPAY_CONFIG.demoMode ? "secondary" : "default"} className={RAZORPAY_CONFIG.demoMode ? "" : "bg-teal-600"}>
            {RAZORPAY_CONFIG.demoMode ? "Demo Mode" : "Live Mode"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Frontend Status */}
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4 text-slate-500" />
                Frontend Key
              </div>
              {status.frontend === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : status.frontend === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Activity className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <div className="text-xs text-slate-600 truncate">
              {RAZORPAY_CONFIG.keyId || 'Not set'}
            </div>
          </div>

          {/* Backend Status */}
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Server className="h-4 w-4 text-slate-500" />
                Firebase Function
              </div>
              {status.backend === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : status.backend === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Activity className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <div className="text-xs text-slate-600">
              createRazorpayOrder
            </div>
          </div>

          {/* API Status */}
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Razorpay API
              </div>
              {status.razorpay === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : status.razorpay === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Activity className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <div className="text-xs text-slate-600">
              {status.razorpay === 'ok' ? 'Verified Connection' : 'Awaiting Test'}
            </div>
          </div>
        </div>

        {status.message && (
          <Alert className={status.razorpay === 'ok' ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {status.razorpay === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <ShieldAlert className="h-4 w-4 text-red-600" />}
            <AlertTitle>{status.razorpay === 'ok' ? "Success" : "Error"}</AlertTitle>
            <AlertDescription className="text-xs font-mono">
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        {status.frontend === 'error' && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription className="text-xs">
              The frontend Key ID is currently using the placeholder. Please set <b>VITE_RAZORPAY_KEY_ID</b> in your environment variables.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50/50 border-t p-4">
        <Button 
          onClick={checkStatus} 
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Run Gateway Diagnostic
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
