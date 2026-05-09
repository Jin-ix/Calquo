import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Database,
  Bug,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase/config';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface AddStockData {
  name: string;
  price: number;
  quantity: number;
  initialized: boolean;
}

interface ValidationErrors {
  name?: string;
  price?: string;
  quantity?: string;
}

// ============================================
// MAIN COMPONENT WITH DEBUG MODE
// ============================================

export function DebugAddStockFormSimple() {
  const { user } = useAuth();
  
  // State Management - The Core of Data Flow
  const [step, setStep] = useState<1 | 2>(1);
  const [debugMode, setDebugMode] = useState(true); // Toggle for debug overlays
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data State - This is what gets passed between steps
  const [addStockData, setAddStockData] = useState<AddStockData>({
    name: '',
    price: 0,
    quantity: 0,
    initialized: false
  });
  
  // Validation Errors
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Submission Result
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    docId?: string;
    error?: string;
  } | null>(null);

  // ============================================
  // VALIDATION LOGIC
  // ============================================
  
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!addStockData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (addStockData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (addStockData.quantity < 1 || addStockData.quantity > 999) {
      newErrors.quantity = 'Quantity must be between 1 and 999';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleInputChange = (field: keyof AddStockData, value: string | number) => {
    setAddStockData(prev => ({
      ...prev,
      [field]: value,
      initialized: true
    }));
    
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Debug log
    if (debugMode) {
      console.log(`[DEBUG] Field Updated: ${field} = ${value}`, {
        ...addStockData,
        [field]: value
      });
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      console.log('[DEBUG] Data passing to review:', addStockData);
      setStep(2);
      
      toast.success('Data validated successfully', {
        description: `Moving to review with: ${addStockData.name}`,
      });
    } else {
      // Shake animation trigger
      const button = document.getElementById('next-button');
      button?.classList.add('animate-shake');
      setTimeout(() => button?.classList.remove('animate-shake'), 500);
      
      toast.error('Please fix validation errors');
    }
  };

  const handleBack = () => {
    setStep(1);
    // Preserve state - data should remain
    console.log('[DEBUG] Returning to Step 1, state preserved:', addStockData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Prepare Firestore data
      const firestoreData = {
        name: addStockData.name,
        price: addStockData.price,
        quantity: addStockData.quantity,
        userId: user?.uid || 'demo-user',
        companyId: user?.company || 'demo-company',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      console.log('[DEBUG] Writing to Firestore:', firestoreData);
      
      // Actual Firestore write
      const docRef = await addDoc(collection(db, 'stocks'), firestoreData);
      
      console.log('[DEBUG] Firestore write successful! Doc ID:', docRef.id);
      
      setSubmitResult({
        success: true,
        docId: docRef.id
      });
      
      toast.success('Stock Added to Firestore!', {
        description: `Document ID: ${docRef.id}`,
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error('[DEBUG] Firestore write failed:', error);
      
      setSubmitResult({
        success: false,
        error: error.message || 'Unknown error'
      });
      
      toast.error('Write Failed', {
        description: 'Check auth/rules/network',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMockData = () => {
    const mockData: AddStockData = {
      name: 'Blue Widget',
      price: 29.99,
      quantity: 50,
      initialized: true
    };
    setAddStockData(mockData);
    toast.info('Mock data loaded');
  };

  // Calculate total
  const total = addStockData.price * addStockData.quantity;

  // ============================================
  // RENDER: STEP 1 - INPUT FORM
  // ============================================
  
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Debug Toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Add Stock - Step 1</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMockData}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Load Mock Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="gap-2"
            >
              {debugMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Debug {debugMode ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Debug Overlay - Step 1 */}
        {debugMode && (
          <Alert className="border-orange-300 bg-orange-50">
            <Bug className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">🐛 Debug Mode: Step 1 Input Form</div>
              <div className="text-xs space-y-1 font-mono">
                <div><strong>State:</strong> {JSON.stringify(addStockData, null, 2)}</div>
                <div><strong>Initialized:</strong> {addStockData.initialized ? '✅' : '❌'}</div>
                <div><strong>Validation:</strong> {Object.keys(errors).length === 0 ? '✅ Valid' : `❌ ${Object.keys(errors).length} errors`}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Input Form */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Enter Stock Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Item Name
                {addStockData.name && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Blue Widget"
                value={addStockData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
              {debugMode && addStockData.name && (
                <p className="text-xs text-green-600">✅ Binding works: addStockData.name = "{addStockData.name}"</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                Price
                {addStockData.price > 0 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={addStockData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`pl-7 ${errors.price ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.price}
                </p>
              )}
              {debugMode && addStockData.price > 0 && (
                <p className="text-xs text-green-600">✅ Binding works: addStockData.price = ${addStockData.price.toFixed(2)}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="flex items-center gap-2">
                Quantity
                {addStockData.quantity > 0 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="999"
                placeholder="0"
                value={addStockData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errors.quantity}
                </p>
              )}
              {debugMode && addStockData.quantity > 0 && (
                <p className="text-xs text-green-600">✅ Binding works: addStockData.quantity = {addStockData.quantity}</p>
              )}
            </div>

            {/* Live Preview */}
            {debugMode && (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-sm font-semibold mb-2">📊 Live State Preview:</div>
                <div className="text-xs font-mono space-y-1">
                  <div>Name: "{addStockData.name || '[empty]'}"</div>
                  <div>Price: ${addStockData.price.toFixed(2)}</div>
                  <div>Quantity: {addStockData.quantity}</div>
                  <div>Total: ${total.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Next Button */}
            <Button
              id="next-button"
              onClick={handleNext}
              disabled={!addStockData.initialized}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
            >
              Next: Review Details
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Validation Status */}
        {debugMode && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <div className="font-semibold">🔍 Validation Status:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {addStockData.name ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span>Name: {addStockData.name || '(empty)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {addStockData.price > 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span>Price: ${addStockData.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {addStockData.quantity >= 1 && addStockData.quantity <= 999 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span>Quantity: {addStockData.quantity}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: STEP 2 - REVIEW & SUBMIT
  // ============================================
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Debug Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Add Stock - Step 2</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDebugMode(!debugMode)}
          className="gap-2"
        >
          {debugMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Debug {debugMode ? 'ON' : 'OFF'}
        </Button>
      </div>

      {/* Debug Overlay - Step 2 */}
      {debugMode && (
        <Alert className={`border-2 ${!addStockData.name ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <Bug className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              {!addStockData.name ? '❌ Review Blank? Debugging...' : '✅ Debug Mode: Step 2 Review'}
            </div>
            {!addStockData.name ? (
              <div className="text-xs space-y-2">
                <div className="font-semibold text-red-700">Possible Causes:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>No props from parent (lift state in React)</li>
                  <li>Builder.io binding wrong (use {'{{state.addStockData}}'})</li>
                  <li>Re-render glitch (add key={'{addStockData.name}'})</li>
                  <li>State not passed between steps</li>
                </ol>
                <div className="font-semibold text-red-700 mt-2">Current State:</div>
                <pre className="bg-white p-2 rounded">{JSON.stringify(addStockData, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-xs font-mono">
                <div><strong>State received:</strong> ✅</div>
                <div><strong>Data:</strong> {JSON.stringify(addStockData, null, 2)}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Review Card */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Review Your Stock Item
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Data Display with Debug Fallbacks */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-semibold">Item:</span>
              <span className={!addStockData.name ? 'text-red-600' : ''}>
                {addStockData.name || '[No Data - Debug: State Missing]'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-semibold">Price:</span>
              <span className={addStockData.price === 0 ? 'text-red-600' : ''}>
                ${addStockData.price?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-semibold">Quantity:</span>
              <span className={addStockData.quantity === 0 ? 'text-red-600' : ''}>
                {addStockData.quantity || 0}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-300">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                ${((addStockData.price * addStockData.quantity) || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Debug Info */}
          {debugMode && (
            <div className="p-3 bg-purple-50 rounded border border-purple-200 text-xs font-mono">
              <div className="font-semibold mb-1">🔍 Binding Check:</div>
              <div>Name binding: {addStockData.name ? '✅' : '❌ FAIL'}</div>
              <div>Price binding: {addStockData.price > 0 ? '✅' : '❌ FAIL'}</div>
              <div>Quantity binding: {addStockData.quantity > 0 ? '✅' : '❌ FAIL'}</div>
              <div>Calculated Total: ${total.toFixed(2)}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 h-12"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !addStockData.name}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Submit to Database
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Firestore Debug Log */}
      {debugMode && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-xs font-mono space-y-2">
              <div className="font-semibold">📝 Firestore Write Preview:</div>
              <pre className="bg-white p-3 rounded overflow-auto">
{`await addDoc(collection(db, 'stocks'), {
  name: "${addStockData.name}",
  price: ${addStockData.price},
  quantity: ${addStockData.quantity},
  userId: "${user?.uid || 'currentUser.uid'}",
  timestamp: serverTimestamp()
})`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success/Error Result */}
      {submitResult && (
        <Card className={`border-2 ${submitResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <CardContent className="pt-6">
            {submitResult.success ? (
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-700">
                  Stock Added to Firestore!
                </div>
                <div className="text-sm">
                  Document ID: <Badge variant="outline">{submitResult.docId}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Collection: stocks
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <div className="text-lg font-bold text-red-700">
                  Write Failed
                </div>
                <div className="text-sm text-red-600">
                  {submitResult.error}
                </div>
                <div className="text-xs text-muted-foreground">
                  Check auth/rules/network
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Firestore Rules Debug */}
      {debugMode && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertDescription>
            <div className="text-sm">
              <div className="font-semibold mb-2">🔐 Firestore Rules Check:</div>
              <div className="font-mono text-xs bg-white p-2 rounded">
                {`allow write: if request.auth != null;`}
              </div>
              <div className="mt-2 text-xs">
                <strong>Current Auth:</strong> {user ? `✅ ${user.email}` : '❌ Not authenticated'}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default DebugAddStockFormSimple;
