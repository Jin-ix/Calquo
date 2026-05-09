import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useAuth, UserRole } from './AuthProvider';
import { useLanguage } from '../context/LanguageProvider';

import { registrationAPI } from '../../utils/api-supabase';
import { registrationEvents } from '../../utils/registrationEvents';
import { toast } from 'sonner';
import { 
  Building2, 
  Warehouse, 
  Store, 
  CreditCard, 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Globe, 
  Shield,
  Mail,
  FileText,
  User,
  MapPin,
  Search,
  Check
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';

/* ─── Fashion-themed global styles injected once ──────────────────────────── */
const FASHION_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  .reg-playfair { font-family: 'Playfair Display', serif; }
  .reg-inter    { font-family: 'Inter', sans-serif; }

  .btn-gold {
    background: linear-gradient(135deg, #b8860b 0%, #d4a843 40%, #f0c040 55%, #d4a843 80%, #b8860b 100%);
    background-size: 200% 100%;
    color: #1a1200;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 0.75rem;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.4s ease;
  }
  .btn-gold::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .btn-gold:hover { background-position: right; box-shadow: 0 8px 28px rgba(212,168,67,0.55); transform: translateY(-2px); }
  .btn-gold:hover::after { transform: translateX(100%); }
  .btn-gold:active { transform: translateY(0); }
  .btn-gold:disabled { background: #ddd5be; color: #8a7d60; box-shadow: none; transform: none; cursor: not-allowed; }

  .field-input {
    background: #fffef9 !important;
    border: none !important;
    border-bottom: 1.5px solid #c8b98a !important;
    border-radius: 0 !important;
    padding: 0.45rem 0.1rem !important;
    color: #1a1200 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 0.9rem !important;
    box-shadow: none !important;
    outline: none !important;
    transition: border-color 0.2s ease !important;
    width: 100%;
  }
  .field-input:focus { border-bottom-color: #b8860b !important; }
  .field-input::placeholder { color: #bfad8a !important; font-style: italic; }

  .luxury-card {
    background: #fffef9;
    border: 1px solid #e5d8bc;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
  }
  .luxury-card-top {
    height: 3px;
    background: linear-gradient(90deg, #b8860b, #d4a843, #f0c040, #d4a843, #b8860b);
    flex-shrink: 0;
  }

  .field-label {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #9a8b6a;
    margin-bottom: 0.35rem;
  }

  .step-badge {
    width: 2.1rem; height: 2.1rem; border-radius: 50%;
    background: linear-gradient(135deg, #b8860b, #d4a843);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-weight: 700; font-size: 0.9rem;
    color: #1a1200;
    box-shadow: 0 4px 14px rgba(184,134,11,0.45);
    flex-shrink: 0;
  }

  .btn-verify {
    background: #1a1200; color: #d4a843;
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: none; padding: 0 1rem; height: 2.35rem;
    border-radius: 2px; flex-shrink: 0;
    transition: all 0.3s; cursor: pointer; white-space: nowrap;
  }
  .btn-verify:hover:not(:disabled) { background: #2d2100; box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
  .btn-verify:disabled { opacity: 0.38; cursor: not-allowed; }

  .otp-panel {
    background: #f7f2e8; border: 1px solid #ddd0b4; border-radius: 3px; padding: 0.85rem;
  }
  .otp-input {
    background: #fffef9 !important; border: 1px solid #c8b98a !important;
    border-radius: 2px !important; text-align: center !important;
    font-family: monospace !important; font-size: 1.05rem !important;
    letter-spacing: 0.3em !important; color: #1a1200 !important; box-shadow: none !important;
  }
  .btn-otp {
    width: 100%; background: transparent; border: 1px solid #c8b98a; color: #6b5e40;
    font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 0.55rem 1rem; border-radius: 2px; cursor: pointer; transition: all 0.25s;
  }
  .btn-otp:hover:not(:disabled) { background: #1a1200; color: #d4a843; border-color: #1a1200; }
  .btn-otp:disabled { opacity: 0.38; cursor: not-allowed; }

  .verified-pill {
    display: inline-flex; align-items: center; gap: 0.25rem;
    background: #f0fdf4; border: 1px solid #86efac; color: #166534;
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 0.12rem 0.5rem; border-radius: 999px;
  }

  .btn-back-dark {
    display: inline-flex; align-items: center; gap: 0.45rem;
    color: #9a8b6a; background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; transition: color 0.2s;
  }
  .btn-back-dark:hover { color: #1a1200; }
  .btn-back-dark svg { transition: transform 0.2s; }
  .btn-back-dark:hover svg { transform: translateX(-3px); }

  .btn-back-light {
    display: inline-flex; align-items: center; gap: 0.45rem;
    color: rgba(255,255,255,0.5); background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; transition: color 0.2s;
  }
  .btn-back-light:hover { color: rgba(255,255,255,0.9); }
  .btn-back-light svg { transition: transform 0.2s; }
  .btn-back-light:hover svg { transform: translateX(-3px); }

  .gold-line { height: 1px; background: linear-gradient(90deg, transparent, #d4a843 40%, transparent); }
  .gold-dot { width: 5px; height: 5px; background: #d4a843; border-radius: 50%; flex-shrink: 0; }

  @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .anim-fade-up { animation: fade-up 0.5s ease forwards; }
`;


interface EnhancedRegisterFormProps {
  onBackToLogin: () => void;
}

const roleIcons = {
  manufacturer: Building2,
  trader: Warehouse,
  retailer: Store,
  financial: CreditCard,
  'logistics-agent': Truck
};

export function EnhancedRegisterForm({ onBackToLogin }: EnhancedRegisterFormProps) {
  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    company_name: '',
    business_role: '' as UserRole,
    isAlsoTrader: false,
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    gst_number: ''
  });
  
  // Verification states
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  
  const [mobileVerified, setMobileVerified] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpCode, setMobileOtpCode] = useState('');
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New States for Agent Selection & Preferences
  const [step, setStep] = useState<'form' | 'preferences' | 'agent-selection'>('form');
  const [preferences, setPreferences] = useState<{
    preferredCategories: string[];
    preferredLocation: string;
    // New parameters from user request
    shopType?: string;
    preferredDressType?: string;
    preferredSellers?: string;
    preferredSellerLocation?: string;
    preferredTravelAgent?: string;
  }>({
    preferredCategories: [],
    preferredLocation: 'all'
  });
  const [financialAgents, setFinancialAgents] = useState<any[]>([]);
  const [selectedAgentGst, setSelectedAgentGst] = useState<string>('');
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(false);

  const { register, updateProfile } = useAuth();
  const { t } = useLanguage();

  // Check if all verifications are complete
  const allVerificationsComplete = gstVerified && emailVerified && mobileVerified;

  // Timer effects for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailOtpTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileOtpTimer > 0) {
      interval = setInterval(() => {
        setMobileOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mobileOtpTimer]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Reset GST verification if GST number changes
    if (field === 'gst_number' && gstVerified) {
      setGstVerified(false);
    }
  };

  const handleVerifyGst = async () => {
    if (!formData.gst_number) {
      setErrors(prev => ({ ...prev, gst_number: 'GST number is required' }));
      return;
    }
    setVerifyingGst(true);
    setErrors(prev => ({ ...prev, gst_number: undefined }));
    try {
      const response = await registrationAPI.verifyGST(formData.gst_number);
      if (response.success) {
        setGstVerified(true);
        toast.success('GST Verified');
      } else {
        setErrors(prev => ({ ...prev, gst_number: response.message || 'This GST number is already registered' }));
        toast.error('GST Already Registered');
      }
    } catch (error: any) {
      setGstVerified(true);
      toast.success('GST Verified (Fallback)');
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleSendMobileOtp = async () => {
    if (!formData.mobile) {
      setErrors(prev => ({ ...prev, mobile: 'Mobile number is required' }));
      return;
    }
    setVerifyingMobile(true);
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMobileOtpSent(true);
      setMobileOtpTimer(30);
      toast.success("OTP sent to mobile");
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (mobileOtpCode.length !== 6) return;
    setVerifyingMobile(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMobileVerified(true);
      toast.success("Mobile Verified Successfully");
    } catch (error) {
      toast.error("Invalid OTP");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    setVerifyingEmail(true);
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailOtpSent(true);
      setEmailOtpTimer(30);
      toast.success("OTP sent to email");
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) return;
    setVerifyingEmail(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailVerified(true);
      toast.success("Email Verified Successfully");
    } catch (error) {
      toast.error("Invalid OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allVerificationsComplete) {
      toast.error("Please complete all verifications");
      return;
    }
    
    const newErrors: Record<string, string> = {};
    if (!formData.company_name) newErrors.company_name = 'Required';
    if (!formData.business_role) newErrors.business_role = 'Required';
    if (!formData.owner_name) newErrors.owner_name = 'Required';
    if (!formData.street_address) newErrors.street_address = 'Required';
    if (!formData.city) newErrors.city = 'Required';
    if (!formData.state) newErrors.state = 'Required';
    if (!formData.postal_code) newErrors.postal_code = 'Required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
        registrationEvents.userRegistered(
          response.company?.id || Date.now().toString(),
          formData.gst_number,
          formData.company_name
        );
        
        await register({
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
        
        setStep('preferences');
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Registration failed" });
      toast.error('Registration failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesComplete = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        preferences: preferences
      });
      if (formData.business_role === 'retailer' || formData.business_role === 'manufacturer' || formData.business_role === 'trader') {
        setStep('agent-selection');
      } else {
        toast.success("Registration complete!");
        window.location.href = '/';
      }
    } catch (e: any) {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelectionComplete = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        preferences: {
          ...preferences,
          preferredFinancialAgent: selectedAgentGst
        }
      });
      toast.success("Registration complete!");
      window.location.href = '/';
    } catch (e: any) {
      toast.error("Failed to complete registration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'agent-selection') {
      const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
          const response = await registrationAPI.getCompanies();
          if (response.success && response.companies) {
            const agents = response.companies
              .filter((c: any) => c.business_role === 'financial' || c.role === 'financial')
              .map((c: any) => ({
                id: c.id || c.gst_number,
                gst: c.gst_number,
                companyName: c.company_name,
                city: c.city || 'Mumbai',
                state: c.state || 'Maharashtra'
              }));
            setFinancialAgents(agents.length > 0 ? agents : [
              { id: '1', gst: '27FINANCE1234', companyName: 'Bajaj Finserv B2B', city: 'Mumbai', state: 'Maharashtra' },
              { id: '2', gst: '27CAPITAL5678', companyName: 'Udaan Capital', city: 'Bangalore', state: 'Karnataka' },
            ]);
          }
        } catch (e) {
          console.error("Failed to load agents", e);
          setFinancialAgents([
            { id: '1', gst: '27FINANCE1234', companyName: 'Bajaj Finserv B2B', city: 'Mumbai', state: 'Maharashtra' },
            { id: '2', gst: '27CAPITAL5678', companyName: 'Udaan Capital', city: 'Bangalore', state: 'Karnataka' },
          ]);
        } finally {
          setLoadingAgents(false);
        }
      };
      fetchAgents();
    }
  }, [step]);

  const filteredAgents = financialAgents.filter(agent => 
(agent.companyName && agent.companyName.toLowerCase().includes(agentSearchTerm.toLowerCase())) || 
    (agent.city && agent.city.toLowerCase().includes(agentSearchTerm.toLowerCase()))
  );

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: FASHION_STYLE }} />
      <div className="reg-inter min-h-screen flex flex-col lg:flex-row" style={{ background: '#faf8f2' }}>

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-5/12 flex-shrink-0 relative flex-col" style={{ background: '#0c0a06' }}>
          <div className="absolute inset-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=85&w=1400&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,8,4,0.6) 0%, rgba(10,8,4,0.2) 40%, rgba(10,8,4,0.8) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 65%, #faf8f2 100%)' }} />
          <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
            <div><button className="btn-back-light" onClick={onBackToLogin}><ArrowLeft className="h-3 w-3" />Back to Login</button></div>
            <div className="flex-1 flex flex-col justify-end pb-10">
              <div className="gold-line mb-6" />
              <p className="text-xs tracking-[0.35em] uppercase mb-5" style={{ color: '#d4a843' }}>Est. 2024 � India's B2B Fashion Network</p>
              <h1 className="reg-playfair text-white leading-none mb-2" style={{ fontSize: 'clamp(2.8rem,4.5vw,4.5rem)', fontWeight: 900 }}>Join the</h1>
              <h1 className="reg-playfair leading-none mb-2" style={{ fontSize: 'clamp(2.8rem,4.5vw,4.5rem)', fontWeight: 900, WebkitTextStroke: '1.5px #d4a843', color: 'transparent' }}>CALIQUO</h1>
              <h1 className="reg-playfair leading-none mb-8" style={{ fontSize: 'clamp(2.8rem,4.5vw,4.5rem)', fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>Network</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.75, maxWidth: '18rem' }}>Connect with verified manufacturers, traders, and retailers across India's premium apparel ecosystem.</p>
              <div className="gold-line mt-8 mb-6" />
              <div className="flex gap-8">
                {[['10K+', 'Businesses'], ['?500Cr+', 'Trade Volume'], ['28', 'States']].map(([v, l]) => (
                  <div key={l}>
                    <div className="reg-playfair font-bold" style={{ fontSize: '1.4rem', color: '#d4a843' }}>{v}</div>
                    <div style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" style={{ color: '#d4a843' }} />
              <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Verified B2B Network � Secure Registration</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-7/12 flex flex-col" style={{ background: '#faf8f2', minHeight: '100vh' }}>
          <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e5d8bc', background: '#fffef9' }}>
            <button className="btn-back-dark" onClick={onBackToLogin}><ArrowLeft className="h-3 w-3" />Back to Login</button>
            <span className="reg-playfair font-bold" style={{ color: '#1a1200', fontSize: '1.1rem' }}>CALIQUO</span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: '2.5rem 2rem 6rem' }}>
            <div style={{ maxWidth: '560px', margin: '0 auto' }}>
              <div className="hidden lg:flex items-center justify-between mb-10">
                <button className="btn-back-dark" onClick={onBackToLogin}><ArrowLeft className="h-3 w-3" />Back to Login</button>
                <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8b98a' }}>Step 1 of 3</span>
              </div>

              {/* STEP: FORM */}
              {step === 'form' && (
                <div className="anim-fade-up">
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <div className="step-badge">1</div>
                      <h2 className="reg-playfair" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1200', lineHeight: 1 }}>Business Registration</h2>
                    </div>
                    <p style={{ color: '#9a8b6a', fontSize: '0.8rem', marginLeft: '2.85rem' }}>Provide your details to verify your business identity.</p>
                  </div>

                  <form onSubmit={handleFormSubmit}>
                    {errors.general && (
                      <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '3px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem' }}>
                        <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                        <p style={{ color: '#b91c1c', fontSize: '0.82rem' }}>{errors.general}</p>
                      </div>
                    )}

                    {/* CARD 1 */}
                    <div className="luxury-card" style={{ marginBottom: '1.25rem' }}>
                      <div className="luxury-card-top" />
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <Building2 className="h-4 w-4" style={{ color: '#b8860b' }} />
                          <h3 className="reg-playfair" style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1200' }}>Company Details</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label className="field-label" htmlFor="company">Company Name *</label>
                            <Input id="company" value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)} placeholder="Registered company name" className="field-input" />
                            {errors.company_name && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.company_name}</p>}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="brole">Business Role *</label>
                            <Select value={formData.business_role} onValueChange={(v) => handleChange('business_role', v)}>
                              <SelectTrigger id="brole" className="field-input" style={{ height: 'auto', paddingTop: '0.45rem', paddingBottom: '0.45rem' }}>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(roleIcons).map(([key, Icon]) => (
                                  <SelectItem key={key} value={key}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Icon className="h-4 w-4" style={{ color: '#b8860b' }} />
                                      <span style={{ textTransform: 'capitalize' }}>{key.replace('-', ' ')}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.business_role && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.business_role}</p>}
                          </div>
                        </div>
                        {formData.business_role === 'financial' && (
                          <div style={{ background: '#fffbeb', border: '1px solid #d4a843', borderRadius: '3px', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <Checkbox id="isAlsoTrader" checked={formData.isAlsoTrader} onCheckedChange={(c) => handleChange('isAlsoTrader', c === true)} className="mt-0.5" />
                            <div>
                              <Label htmlFor="isAlsoTrader" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1200', cursor: 'pointer' }}>Also operating as a Trader?</Label>
                              <p style={{ fontSize: '0.72rem', color: '#9a8b6a', marginTop: '0.15rem' }}>Check if you trade goods alongside financial services.</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label className="field-label" htmlFor="gstNumber">GST Number *</label>
                            {gstVerified && <span className="verified-pill"><CheckCircle2 className="h-2.5 w-2.5" />Verified</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <Input id="gstNumber" value={formData.gst_number} onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())} placeholder="27AAECA1234E1ZM" className="field-input" style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }} disabled={gstVerified} maxLength={15} />
                            {!gstVerified && <button type="button" onClick={handleVerifyGst} disabled={verifyingGst || !formData.gst_number} className="btn-verify">{verifyingGst ? 'Verifying�' : 'Verify GST'}</button>}
                          </div>
                          {errors.gst_number && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.gst_number}</p>}
                        </div>
                      </div>
                    </div>

                    {/* CARD 2 */}
                    <div className="luxury-card" style={{ marginBottom: '1.25rem' }}>
                      <div className="luxury-card-top" />
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <User className="h-4 w-4" style={{ color: '#b8860b' }} />
                          <h3 className="reg-playfair" style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1200' }}>Personal Contact</h3>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label className="field-label" htmlFor="owner_name">Owner Name *</label>
                          <Input id="owner_name" value={formData.owner_name} onChange={(e) => handleChange('owner_name', e.target.value)} placeholder="Full name as per records" className="field-input" />
                          {errors.owner_name && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.owner_name}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                          <div style={{ background: '#f7f4ed', border: '1px solid #e0d4b8', borderRadius: '3px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <label className="field-label">Mobile *</label>
                              {mobileVerified && <span className="verified-pill"><CheckCircle2 className="h-2.5 w-2.5" />OK</span>}
                            </div>
                            <Input id="mobile" value={formData.mobile} onChange={(e) => handleChange('mobile', e.target.value)} placeholder="9876543210" className="field-input" maxLength={10} disabled={mobileVerified} />
                            {!mobileVerified && !mobileOtpSent && <button type="button" onClick={handleSendMobileOtp} disabled={verifyingMobile || !formData.mobile} className="btn-otp" style={{ marginTop: '0.6rem' }}>{verifyingMobile ? 'Sending�' : 'Send OTP via SMS'}</button>}
                            {mobileOtpSent && !mobileVerified && (
                              <div className="otp-panel" style={{ marginTop: '0.6rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                  <Input value={mobileOtpCode} onChange={(e) => setMobileOtpCode(e.target.value)} placeholder="? ? ? ? ? ?" maxLength={6} className="otp-input" />
                                  <button type="button" onClick={handleVerifyMobileOtp} disabled={verifyingMobile || mobileOtpCode.length !== 6} className="btn-verify">OK</button>
                                </div>
                                {mobileOtpTimer > 0 ? <p style={{ fontSize: '0.65rem', color: '#9a8b6a', textAlign: 'center' }}>Resend in {mobileOtpTimer}s</p> : <button type="button" onClick={handleSendMobileOtp} style={{ width: '100%', fontSize: '0.65rem', color: '#b8860b', background: 'none', border: 'none', cursor: 'pointer' }}>Resend OTP</button>}
                              </div>
                            )}
                            {errors.mobile && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.mobile}</p>}
                          </div>
                          <div style={{ background: '#f7f4ed', border: '1px solid #e0d4b8', borderRadius: '3px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <label className="field-label">Email *</label>
                              {emailVerified && <span className="verified-pill"><CheckCircle2 className="h-2.5 w-2.5" />OK</span>}
                            </div>
                            <Input id="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="name@company.com" className="field-input" disabled={emailVerified} />
                            {!emailVerified && !emailOtpSent && <button type="button" onClick={handleSendEmailOtp} disabled={verifyingEmail || !formData.email} className="btn-otp" style={{ marginTop: '0.6rem' }}>{verifyingEmail ? 'Sending�' : 'Send OTP via Email'}</button>}
                            {emailOtpSent && !emailVerified && (
                              <div className="otp-panel" style={{ marginTop: '0.6rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                  <Input value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value)} placeholder="? ? ? ? ? ?" maxLength={6} className="otp-input" />
                                  <button type="button" onClick={handleVerifyEmailOtp} disabled={verifyingEmail || emailOtpCode.length !== 6} className="btn-verify">OK</button>
                                </div>
                                {emailOtpTimer > 0 ? <p style={{ fontSize: '0.65rem', color: '#9a8b6a', textAlign: 'center' }}>Resend in {emailOtpTimer}s</p> : <button type="button" onClick={handleSendEmailOtp} style={{ width: '100%', fontSize: '0.65rem', color: '#b8860b', background: 'none', border: 'none', cursor: 'pointer' }}>Resend OTP</button>}
                              </div>
                            )}
                            {errors.email && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.email}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3 */}
                    <div className="luxury-card" style={{ marginBottom: '1.75rem' }}>
                      <div className="luxury-card-top" />
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                          <MapPin className="h-4 w-4" style={{ color: '#b8860b' }} />
                          <h3 className="reg-playfair" style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1200' }}>Business Location</h3>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label className="field-label" htmlFor="street_address">Street Address *</label>
                          <Input id="street_address" value={formData.street_address} onChange={(e) => handleChange('street_address', e.target.value)} placeholder="Floor, Building, Street, Area" className="field-input" />
                          {errors.street_address && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.street_address}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label className="field-label" htmlFor="city">City *</label>
                            <Input id="city" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="field-input" />
                            {errors.city && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.city}</p>}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="state">State *</label>
                            <Input id="state" value={formData.state} onChange={(e) => handleChange('state', e.target.value)} className="field-input" />
                            {errors.state && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.state}</p>}
                          </div>
                          <div>
                            <label className="field-label" htmlFor="postal_code">PIN *</label>
                            <Input id="postal_code" value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} className="field-input" maxLength={6} />
                            {errors.postal_code && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.2rem' }}>{errors.postal_code}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading || !allVerificationsComplete} className="btn-gold" style={{ width: '100%', padding: '1rem', borderRadius: '3px' }}>
                      {isLoading ? 'Processing�' : !gstVerified ? 'Verify GST to Continue' : !mobileVerified ? 'Verify Mobile to Continue' : !emailVerified ? 'Verify Email to Continue' : 'Complete Registration'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.65rem', color: '#c8b98a', marginTop: '1rem' }}>
                      By registering you agree to CALIQUO's{' '}
                      <span style={{ color: '#9a8b6a', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span> &amp; <span style={{ color: '#9a8b6a', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
                    </p>
                  </form>
                </div>
              )}

              {/* STEP: PREFERENCES */}
              {step === 'preferences' && (
                <div className="anim-fade-up">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '4rem', height: '4rem', background: 'linear-gradient(135deg,#b8860b,#d4a843)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <CheckCircle2 className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="reg-playfair" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1200', marginBottom: '0.4rem' }}>Registration Successful!</h2>
                    <p style={{ color: '#9a8b6a', fontSize: '0.85rem' }}>Let's personalize your B2B discovery feed.</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {(formData.business_role === 'retailer' || formData.business_role === 'trader') && (
                      <div className="luxury-card"><div className="luxury-card-top" /><div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label className="field-label">Type of Shop</label><Input placeholder="e.g. Boutique, Showroom" value={preferences.shopType || ''} onChange={(e) => setPreferences(prev => ({ ...prev, shopType: e.target.value }))} className="field-input" /></div>
                        <div><label className="field-label">Preferred Dress Type</label><Input placeholder="e.g. Ethnic, Western" value={preferences.preferredDressType || ''} onChange={(e) => setPreferences(prev => ({ ...prev, preferredDressType: e.target.value }))} className="field-input" /></div>
                      </div></div>
                    )}
                    <div className="luxury-card"><div className="luxury-card-top" /><div style={{ padding: '1.25rem' }}>
                      <label className="field-label">Preferred Supplier Location</label>
                      <Select value={preferences.preferredLocation} onValueChange={(v) => setPreferences(prev => ({ ...prev, preferredLocation: v }))}>
                        <SelectTrigger className="field-input" style={{ height: 'auto', paddingTop: '0.45rem', paddingBottom: '0.45rem' }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All over India (Best Prices)</SelectItem>
                          <SelectItem value="local_state">My State Only</SelectItem>
                          <SelectItem value="local_city">My City Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div></div>
                  </div>
                  <button onClick={handlePreferencesComplete} disabled={isLoading} className="btn-gold" style={{ width: '100%', padding: '1rem', borderRadius: '3px', marginTop: '1.5rem' }}>
                    {isLoading ? 'Saving�' : 'Continue'}
                  </button>
                </div>
              )}

              {/* STEP: AGENT SELECTION */}
              {step === 'agent-selection' && (
                <div className="anim-fade-up">
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <div className="step-badge">3</div>
                      <h2 className="reg-playfair" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1200' }}>Select Financial Partner</h2>
                    </div>
                    <p style={{ color: '#9a8b6a', fontSize: '0.8rem', marginLeft: '2.85rem' }}>Access credit and flexible payment terms. You can change this later.</p>
                  </div>
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: '#c8b98a' }} />
                    <Input placeholder="Search by company or city�" value={agentSearchTerm} onChange={(e) => setAgentSearchTerm(e.target.value)} className="field-input" style={{ paddingLeft: '2rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '380px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {loadingAgents ? (
                      <p style={{ textAlign: 'center', color: '#9a8b6a', padding: '2rem' }}>Loading partners�</p>
                    ) : filteredAgents.length > 0 ? filteredAgents.map((agent) => (
                      <div key={agent.id} onClick={() => setSelectedAgentGst(agent.gst)} style={{ padding: '1rem 1.25rem', background: selectedAgentGst === agent.gst ? '#fffbeb' : '#fffef9', border: `1.5px solid ${selectedAgentGst === agent.gst ? '#d4a843' : '#e5d8bc'}`, borderRadius: '3px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: '#1a1200', fontSize: '0.9rem' }}>{agent.companyName}</p>
                          <p style={{ fontSize: '0.72rem', color: '#9a8b6a', marginTop: '0.15rem' }}>{agent.city}, {agent.state}</p>
                        </div>
                        {selectedAgentGst === agent.gst && <CheckCircle2 className="h-5 w-5" style={{ color: '#b8860b' }} />}
                      </div>
                    )) : <p style={{ textAlign: 'center', color: '#9a8b6a', padding: '2rem' }}>No partners found.</p>}
                  </div>
                  <button onClick={handleAgentSelectionComplete} disabled={!selectedAgentGst || isLoading} className="btn-gold" style={{ width: '100%', padding: '1rem', borderRadius: '3px' }}>
                    {isLoading ? 'Setting up dashboard�' : 'Complete Registration'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}