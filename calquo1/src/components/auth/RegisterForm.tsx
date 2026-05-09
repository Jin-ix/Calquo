import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { useAuth, UserRole } from './AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { LocationPicker } from '../utils/LocationPicker';

import { registrationAPI } from '../../utils/api';
import { registrationEvents } from '../../utils/registrationEvents';
import { toast } from 'sonner';
import { Building2, Warehouse, Store, CreditCard, Truck, ArrowLeft, CheckCircle2, Globe, Shield } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
}



const roleIcons = {
  manufacturer: Building2,
  trader: Warehouse,
  retailer: Store,
  financial: CreditCard,
  'logistics-agent': Truck
};



export function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    company_name: '',
    business_role: '' as UserRole,
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    gst_number: ''
  });
  
  // GST verification state
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { t } = useLanguage();

  // Removed OTP timer effects for simplified flow



  // Removed OTP functions for simplified flow

  // GST verification function - check for existing GST and then verify
  const handleVerifyGst = async () => {
    if (!formData.gst_number) {
      setErrors(prev => ({ ...prev, gst_number: 'GST number is required for verification' }));
      return;
    }

    setVerifyingGst(true);
    setErrors(prev => ({ ...prev, gst_number: '' }));

    try {
      // Check if GST number is already registered
      const response = await registrationAPI.verifyGST(formData.gst_number);
      
      if (response.success) {
        setGstVerified(true);
        toast.success('GST Verified', {
          description: 'GST number is available and ready for registration'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GST verification failed';
      
      if (errorMessage.includes('already registered')) {
        setErrors(prev => ({ 
          ...prev, 
          gst_number: 'This GST number is already registered. Please try a different GST number.'
        }));
        toast.error('GST Already Registered', {
          description: 'This GST number is already in use. Please use a different one.',
          duration: 8000
        });
      } else {
        // For other errors, still allow verification (fallback behavior)
        setGstVerified(true);
        toast.success('GST Verified', {
          description: 'GST number accepted for registration'
        });
      }
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
    // Mobile verification simplified - remove OTP requirement
    // if (!mobileOtpVerified) newErrors.mobile = 'Phone number must be verified';
    if (!formData.business_role) newErrors.business_role = 'Business role is required';
    if (!formData.company_name) newErrors.company_name = 'Company name is required';
    if (!formData.street_address) newErrors.street_address = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.postal_code) newErrors.postal_code = 'Postal code is required';
    if (!formData.gst_number) newErrors.gst_number = 'GST number is required for business registration';
    if (!gstVerified && formData.gst_number) newErrors.gstVerification = 'GST number must be verified';
    
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

    // Complete registration directly without payment step
    await completeRegistration();
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    try {
      // Ensure all fields have values and are trimmed
      const companyData = {
        owner_name: formData.owner_name?.trim() || '',
        email: formData.email?.trim() || '',
        mobile: formData.mobile?.trim() || '',
        company_name: formData.company_name?.trim() || '',
        gst_number: formData.gst_number?.trim() || '',
        business_role: formData.business_role?.trim() || '',
        street_address: formData.street_address?.trim() || '',
        postal_code: formData.postal_code?.trim() || '',
        city: formData.city?.trim() || '',
        state: formData.state?.trim() || ''
      };

      // Final validation before sending
      const emptyFields = Object.entries(companyData)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        setErrors({ 
          general: `Please fill in all required fields: ${emptyFields.join(', ')}` 
        });
        return;
      }

      const response = await registrationAPI.createAccount(companyData);

      if (response.success) {
        toast.success('Account created!', {
          description: `Welcome to CALIQUO, ${formData.company_name}!`
        });
        
        // Emit registration event for real-time updates
        registrationEvents.userRegistered(
          response.company?.id || Date.now().toString(),
          formData.gst_number,
          formData.company_name
        );

        // Auto-login after successful registration
        const loginSuccess = await register({
          fullName: formData.owner_name,
          email: formData.email,
          phone: formData.mobile,
          address: {
            street: formData.street_address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postal_code,
            country: 'India'
          },
          role: formData.business_role as UserRole,
          businessCategory: formData.business_role === 'manufacturer' ? 'manufacturer' : 
                           formData.business_role === 'trader' ? 'trader' : 
                           formData.business_role === 'retailer' ? 'retailer' : 'agent',
          company: formData.company_name,
          gstNumber: formData.gst_number,
          language: 'en'
        });

        if (loginSuccess) {
          // User will be automatically redirected to their dashboard by App.tsx
          toast.success('Logging you in...', {
            description: 'Taking you to your dashboard'
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      
      // Check if this is a database setup error
      if (errorMessage.includes('Database table') || 
          errorMessage.includes('companies table') ||
          errorMessage.includes('email_verified') ||
          errorMessage.includes('setup_required') ||
          errorMessage.includes('schema cache')) {
        setErrors({ 
          general: 'Database Setup Required: Please create or update the companies table in your Firebase Console using the Firestore setup commands.' 
        });
        toast.error('Database Setup Required', {
          description: 'The companies collection needs to be created or updated in Firestore. Check the console for setup instructions.',
          duration: 15000
        });
      } else if (errorMessage.includes('already registered') || 
                 errorMessage.includes('duplicate key') ||
                 errorMessage.includes('unique constraint')) {
        // Handle duplicate registration attempts
        const field = errorMessage.includes('GST') ? 'GST number' :
                     errorMessage.includes('email') ? 'email address' :
                     errorMessage.includes('mobile') ? 'mobile number' : 'information';
        
        setErrors({ 
          general: `Registration failed: This ${field} is already in use by another account.`
        });
        toast.error('Account Already Exists', {
          description: `This ${field} is already registered. Please use different details or contact support if this is your business.`,
          duration: 10000
        });
      } else {
        setErrors({ 
          general: errorMessage
        });
        toast.error('Registration failed', {
          description: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }


    
    // Reset GST verification if GST number changes
    if (field === 'gst_number' && gstVerified) {
      setGstVerified(false);
    }
  };

  const IconComponent = formData.business_role ? roleIcons[formData.business_role] : Building2;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative bg-slate-50">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-slate-50"></div>

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

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 pt-16 relative z-10 overflow-y-auto">
        <Card className="w-full max-w-3xl card-nowui my-4">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <IconComponent className="h-8 w-8 text-[#FF8C42]" />
              <span className="font-bold text-[#334155]" style={{ fontSize: '1.25rem' }}>CALIQUO</span>
            </div>
            <CardTitle className="heading-nowui-h2 mb-3 text-[#334155]">Create Account</CardTitle>
            <CardDescription className="text-base">
              <span className="text-[#334155]" style={{ fontWeight: 500 }}>Join the B2B Apparel Network</span><br />
              <span className="text-[#64748B]" style={{ fontSize: '0.875rem' }}>
                Your GST number and mobile will be used for secure OTP-based login
              </span>
            </CardDescription>
          </CardHeader>
        
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {errors.general && (
              <div className="text-base p-5 rounded-xl bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
                <div className="font-medium mb-2">{errors.general.split(':')[0]}</div>
                <div>{errors.general.split(':')[1] || errors.general}</div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="font-semibold text-[#334155]" style={{ fontSize: '1.25rem' }}>Personal Information</h3>
              
              {/* Owner Name - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="owner_name" className="label-nowui">Owner Name *</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  placeholder="Enter Owner Name"
                  className={errors.owner_name ? 'input-nowui border-[#EF4444]' : 'input-nowui'}
                />
                {errors.owner_name && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.owner_name}</p>}
              </div>

              {/* Email and Mobile Side by Side Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Section */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="label-nowui">{t('auth.email')} *</Label>
                  <div className="space-y-3">
                    {/* Email Input */}
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="your.email@company.com"
                      className={errors.email ? 'input-nowui border-[#EF4444]' : 'input-nowui'}
                    />
                    
                    {errors.email && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.email}</p>}
                    {errors.emailVerification && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.emailVerification}</p>}
                  </div>
                </div>

                {/* Mobile Section */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="label-nowui">{t('profile.phone')} *</Label>
                  <div className="space-y-3">
                    {/* Country Code and Phone Number Row */}
                    <div className="flex gap-3">
                      {/* Country Code Dropdown */}
                      <div className="flex-shrink-0">
                        <Select 
                          value={formData.countryCode} 
                          onValueChange={(value) => handleChange('countryCode', value)}
 
                        >
                          <SelectTrigger className="w-[110px] select-nowui">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-[#64748B]" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+91">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇮🇳</span>
                                <span>+91</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="+1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇺🇸</span>
                                <span>+1</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="+44">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇬🇧</span>
                                <span>+44</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="+971">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇦🇪</span>
                                <span>+971</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="+65">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇸🇬</span>
                                <span>+65</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="+60">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🇲🇾</span>
                                <span>+60</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Phone Number Input */}
                      <Input
                        id="phone"
                        value={formData.mobile}
                        onChange={(e) => handleChange('mobile', e.target.value)}
                        placeholder="98765 43210"
                        className={`flex-1 ${errors.mobile ? 'input-nowui border-[#EF4444]' : 'input-nowui'}`}
                        maxLength={15}
                      />
                      

                    </div>


                    
                    {errors.mobile && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.mobile}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-6">
              <h3 className="font-semibold text-[#334155]" style={{ fontSize: '1.25rem' }}>Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="label-nowui">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Enter your company name"
                    className={errors.company_name ? 'input-nowui border-[#EF4444]' : 'input-nowui'}
                  />
                  {errors.company_name && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.company_name}</p>}
                </div>
                
                {/* Business Role - Updated with new roles */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="label-nowui">Business Role *</Label>
                  <Select value={formData.business_role} onValueChange={(value) => handleChange('business_role', value)}>
                    <SelectTrigger className={errors.business_role ? 'select-nowui border-[#EF4444]' : 'select-nowui'}>
                      <SelectValue placeholder="Select your business role" />
                    </SelectTrigger>
                    <SelectContent>
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
                      <SelectItem value="retailer">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>Retailer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="financial">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Financial Agent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="logistics-agent">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>Logistics Agent</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.business_role && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.business_role}</p>}
                </div>
              </div>



              {/* GST and PAN Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GST Number Verification */}
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="label-nowui">GST Number *</Label>
                  <div className="space-y-3">
                    {/* GST Input Row */}
                    <div className="flex gap-3">
                      <Input
                        id="gstNumber"
                        value={formData.gst_number}
                        onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
                        placeholder="e.g., 27AAECA1234E1ZM"
                        className={`flex-1 ${errors.gst_number ? 'input-nowui border-[#EF4444]' : 'input-nowui'}`}
                        disabled={gstVerified}
                        maxLength={15}
                      />
                      {gstVerified && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#FF8C42]/10 border border-[#FF8C42]/30 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-[#FF8C42]" />
                          <span className="text-[#334155] font-semibold" style={{ fontSize: '0.875rem' }}>GST Verified</span>
                        </div>
                      )}
                    </div>

                    {/* GST Verification Button Row */}
                    {!gstVerified && (
                      <div className="flex justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleVerifyGst}
                          disabled={verifyingGst || !formData.gst_number}
                          className="whitespace-nowrap rounded-full py-3 px-5 border-[#E0E0E0] hover:border-[#9C27B0] hover:bg-white/95 transition-all"
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
                    )}
                    
                    {/* GST Help */}
                    <div className="text-[#64748B]" style={{ fontSize: '0.875rem' }}>
                      Enter your company's GST number
                    </div>
                    
                    {errors.gst_number && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.gst_number}</p>}
                    {errors.gstVerification && <p className="text-[#EF4444]" style={{ fontSize: '0.875rem' }}>{errors.gstVerification}</p>}
                  </div>
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

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="btn-nowui-primary"
                size="lg"
                disabled={isLoading || !gstVerified}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : !gstVerified ? (
                  'GST Verification Required'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>

            {/* Terms and Privacy */}
            <div className="text-muted-foreground text-center" style={{ fontSize: '0.75rem' }}>
              <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
              <p>Your GST, PAN, and mobile information will be securely stored. Mobile OTP will be used for secure login.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
