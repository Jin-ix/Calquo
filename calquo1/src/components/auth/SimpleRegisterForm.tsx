import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth, UserRole } from './AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { JoiningFeePayment } from '../payments/JoiningFeePayment';
import { LocationPicker } from '../utils/LocationPicker';
import { registrationAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import { Building2, Warehouse, Store, CreditCard, Truck, ArrowLeft, CheckCircle2, Clock, Shield, AlertTriangle } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

type RegistrationStep = 'form' | 'payment' | 'complete';

const roleIcons = {
  manufacturer: Building2,
  trader: Warehouse,
  retailer: Store,
  financial_agent: CreditCard,
  logistics_agent: Truck
} as const;

export function SimpleRegisterForm({ onBackToLogin }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    mobile: '',
    company_name: '',
    business_role: '' as UserRole,
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    gst_number: ''
  });
  
  // Simplified verification state - no OTP required
  const mobileOtpVerified = true; // Always verified for simplified flow
  
  // GST verification state
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { t } = useLanguage();

  // Removed OTP timer effect for simplified flow

  const requiresJoiningFee = () => {
    return formData.business_role && ['manufacturer', 'trader', 'financial_agent'].includes(formData.business_role);
  };

  // Removed OTP functions for simplified flow

  // GST verification function - simplified to accept any GST number
  const handleVerifyGst = async () => {
    if (!formData.gst_number) {
      setErrors(prev => ({ ...prev, gst_number: 'GST number is required for verification' }));
      return;
    }

    setVerifyingGst(true);
    setErrors(prev => ({ ...prev, gst_number: '' }));

    try {
      const response = await registrationAPI.verifyGST(formData.gst_number);
      
      if (response.success) {
        setGstVerified(true);
        toast.success('GST number verified successfully!');
        console.log('GST verification successful for:', formData.gst_number);
      }
    } catch (error) {
      console.error('GST verification failed:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'GST verification failed. Please check the number and try again.';
      
      // Check if this is a database setup issue
      if (errorMessage.includes('does not exist') || 
          errorMessage.includes('column') || 
          errorMessage.includes('relation') ||
          errorMessage.includes('42703') ||
          errorMessage.includes('42P01')) {
        setErrors({ 
          general: 'Database configuration error. Please contact support.' 
        });
        toast.error('Database Error', {
          description: 'A database configuration error occurred.',
          duration: 5000
        });
      }
      
      setErrors(prev => ({ 
        ...prev, 
        gstVerification: errorMessage
      }));
      toast.error('GST verification failed', {
        description: errorMessage
      });
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.owner_name) newErrors.owner_name = 'Owner name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.mobile) newErrors.mobile = 'Phone number is required';
    // Mobile verification simplified - no OTP required
    if (!formData.business_role) newErrors.business_role = 'Business role is required';
    if (!formData.company_name) newErrors.company_name = 'Company name is required';
    if (!formData.street_address) newErrors.street_address = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.postal_code) newErrors.postal_code = 'Postal code is required';
    if (!formData.gst_number) newErrors.gst_number = 'GST number is required for business registration';
    if (!gstVerified && formData.gst_number) newErrors.gstVerification = 'GST number must be verified';
    
    // GST validation simplified - no format checking required
    
    // Validate postal code (6 digits)
    const postalRegex = /^[0-9]{6}$/;
    if (formData.postal_code && !postalRegex.test(formData.postal_code)) {
      newErrors.postal_code = 'Postal code must be exactly 6 digits';
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    // If joining fee is required, proceed to payment step
    if (requiresJoiningFee()) {
      setCurrentStep('payment');
    } else {
      // For retailers and logistics agents, complete registration directly
      await completeRegistration();
    }
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    try {
      const companyData = {
        owner_name: formData.owner_name,
        email: formData.email,
        mobile: formData.mobile,
        company_name: formData.company_name,
        gst_number: formData.gst_number,
        business_role: formData.business_role,
        street_address: formData.street_address,
        postal_code: formData.postal_code,
        city: formData.city,
        state: formData.state
      };

      const response = await registrationAPI.createAccount(companyData);

      if (response.success) {
        setCurrentStep('complete');
        toast.success('Account created successfully!', {
          description: `Welcome to Tex-App, ${formData.company_name}!`
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      
      // Check if this is a database setup error
      if (errorMessage.includes('Database table not found') || 
          errorMessage.includes('companies table') ||
          errorMessage.includes('email_verified') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('column') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('42703') ||
          errorMessage.includes('42P01')) {
        setErrors({ 
          general: 'Database configuration error. Please contact support.' 
        });
        toast.error('Database Error', {
          description: 'A database configuration error occurred.',
          duration: 5000
        });
      } else {
        setErrors({ 
          general: errorMessage
        });
        toast.error('Registration failed', {
          description: errorMessage
        });
      }
      
      setCurrentStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      completeRegistration();
    } else {
      setCurrentStep('form');
      setErrors({ general: 'Payment failed. Please try again or contact support.' });
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Removed mobile OTP verification for simplified flow
    
    // Reset GST verification if GST number changes
    if (field === 'gst_number' && gstVerified) {
      setGstVerified(false);
    }
  };

  const IconComponent = formData.business_role ? roleIcons[formData.business_role] : Building2;

  // Payment step
  if (currentStep === 'payment') {
    return (
      <>
        <div className="min-h-screen flex flex-col overflow-hidden relative bg-slate-50">
          <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <JoiningFeePayment
            userRole={formData.business_role as 'manufacturer' | 'trader' | 'financial_agent'}
            userDetails={{
              fullName: formData.owner_name,
              email: formData.email,
              company: formData.company_name
            }}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => setCurrentStep('form')}
          />
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // Registration completed step
  if (currentStep === 'complete') {
    return (
      <>
        <div className="min-h-screen flex flex-col overflow-hidden relative bg-slate-50">
          <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-green-600">Account Created!</CardTitle>
              <CardDescription>
                Welcome to Tex-App! Your account has been successfully created and verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onBackToLogin} className="w-full">
                Continue to Login
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col overflow-hidden relative bg-slate-50">
        {/* Top Bar - Logo and Back Button */}
        <div className="fixed top-0 left-0 right-0 p-4 z-10 flex items-center justify-between">
          {/* Logo Icon - Left */}
          <div className="w-8 h-8 border-2 border-white/80 rounded-full bg-white/95 hover:bg-white transition-all shadow-sm flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[#FF8C42]" />
          </div>

          {/* Back Button - Right */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBackToLogin}
            className="h-8 px-3 border-2 border-white/80 rounded-full bg-white/95 hover:bg-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-xs">Back</span>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 pt-16 relative z-10 overflow-y-auto">
          <Card className="w-full max-w-2xl my-4">
            <CardHeader className="text-center">
              <div className="flex items-center gap-2 mb-6">
                <IconComponent className="h-6 w-6" />
                <span>CALIQUO</span>
              </div>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Join the B2B Apparel Network<br />
                <span className="text-xs text-muted-foreground">
                  Your GST number and mobile will be used for secure authentication
                </span>
              </CardDescription>
            </CardHeader>
        
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {errors.general && (
              <div className="text-sm p-4 rounded-md bg-destructive/10 text-destructive">
                <div className="font-medium mb-2">{errors.general.split(':')[0]}</div>
                <div>{errors.general.split(':')[1] || errors.general}</div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name *</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  placeholder="Enter Owner Name"
                  className={errors.owner_name ? 'border-destructive' : ''}
                />
                {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name}</p>}
              </div>

              {/* Email and Mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Mobile Section */}
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground text-sm">
                        <span className="text-lg">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <Input
                        id="mobile"
                        value={formData.mobile}
                        onChange={(e) => {
                          // Only allow numeric input for mobile
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          handleChange('mobile', value);
                        }}
                        placeholder="9876543210"
                        className={`flex-1 ${errors.mobile ? 'border-destructive' : ''}`}

                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />

                    </div>

                    {/* Mobile OTP Button - Removed for simplified flow */}
                    
                    {/* Mobile OTP Input - Removed for simplified flow */}
                    
                    {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className={errors.company_name ? 'border-destructive' : ''}
                  />
                  {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
                </div>

                {/* Business Role */}
                <div className="space-y-2">
                  <Label htmlFor="business_role">Business Role *</Label>
                  <Select 
                    value={formData.business_role} 
                    onValueChange={(value) => handleChange('business_role', value)}
                  >
                    <SelectTrigger className={errors.business_role ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retailer">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>Retailer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manufacturer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>Manufacturer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="trader">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          <span>Trader</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="financial_agent">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Financial Agent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="logistics_agent">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>Logistics Agent</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.business_role && <p className="text-sm text-destructive">{errors.business_role}</p>}
                </div>
              </div>

              {/* GST Number */}
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number *</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="gst_number"
                      value={formData.gst_number}
                      onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
                      placeholder="Enter your GST number"
                      className={`flex-1 ${errors.gst_number ? 'border-destructive' : ''}`}
                      disabled={gstVerified}
                      maxLength={15}
                    />
                    
                    {gstVerified && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>

                  {!gstVerified && (
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleVerifyGst}
                          disabled={verifyingGst || !formData.gst_number}
                          className="whitespace-nowrap"
                        >
                          {verifyingGst ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Verify GST
                            </>
                          )}
                        </Button>
                      </div>
                      

                    </div>
                  )}
                  
                  {errors.gst_number && <p className="text-sm text-destructive">{errors.gst_number}</p>}
                  {errors.gstVerification && (
                    <>
                      <p className="text-sm text-destructive">{errors.gstVerification}</p>
                      

                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information - Using Location Picker */}
            <LocationPicker
              value={{
                street_address: formData.street_address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code
              }}
              onChange={(location) => {
                handleChange('street_address', location.street_address);
                handleChange('city', location.city);
                handleChange('state', location.state);
                handleChange('postal_code', location.postal_code);
              }}
              errors={{
                street_address: errors.street_address,
                city: errors.city,
                state: errors.state,
                postal_code: errors.postal_code
              }}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !mobileOtpVerified || !gstVerified}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Creating Account...
                </>
              ) : requiresJoiningFee() ? (
                'Proceed to Payment'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
      <Toaster />
    </>
  );
}
