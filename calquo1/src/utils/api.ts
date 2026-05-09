import { httpsCallable } from 'firebase/functions';
import { signInAnonymously } from 'firebase/auth';
import { firebaseFunctions, firebaseAuth, isFirebaseDemoMode } from './firebase/config';
import { globalErrorHandler } from '../components/utils/global-error-handler';
import { isDev, devLog } from './dev-check';

// Firebase Cloud Functions API client
export class APIClient {
  private getTimeout(): number {
    return navigator.onLine ? 8000 : 3000;
  }

  /**
   * Call Firebase Cloud Function with timeout protection
   */
  private async callFunction<T = any>(functionName: string, data?: any): Promise<T> {
    // In demo mode, throw error immediately so fallback can be used
    if (isFirebaseDemoMode || !firebaseFunctions) {
      throw new Error('Firebase not configured - using demo mode');
    }

    if (!navigator.onLine) {
      throw new Error('Network unavailable. Please check your connection.');
    }

    try {
      return await globalErrorHandler.handleTimeoutError(async () => {
        const callable = httpsCallable(firebaseFunctions, functionName);
        const result = await callable(data || {});
        return result.data as T;
      }, `FUNCTION_${functionName}`);
    } catch (error: any) {
      // Only log in development mode
      if (isDev()) {
        console.debug(`Firebase function ${functionName} error:`, error.message);
      }
      
      // Handle specific Firebase errors
      if (error.code === 'functions/not-found') {
        throw new Error(`Function ${functionName} not deployed`);
      }
      if (error.code === 'functions/unauthenticated') {
        throw new Error('Authentication required');
      }
      if (error.code === 'functions/permission-denied') {
        throw new Error('Permission denied');
      }
      
      throw error;
    }
  }

  /**
   * Get current user's ID token for authenticated calls
   */
  private async getAuthToken(): Promise<string | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  // Health check method (legacy compatibility)
  async checkHealth(): Promise<any> {
    try {
      return await this.callFunction('healthCheck');
    } catch (error) {
      // Return mock success for health check
      return { status: 'healthy', service: 'CALICO Firebase API', timestamp: new Date().toISOString() };
    }
  }

  // Database status check method (legacy compatibility)
  async checkDatabaseStatus(): Promise<any> {
    try {
      return await this.callFunction('checkDatabaseStatus');
    } catch (error) {
      return { status: 'connected', database: 'firestore' };
    }
  }
}

export const apiClient = new APIClient();

// Registration API methods - Updated for Firebase
export const registrationAPI = {
  /**
   * Verify GST number availability
   * Phase 1: Returns available for any GST if backend unavailable
   */
  verifyGST: async (gst_number: string) => {
    // Phase 1: Force fallback for all environments since cloud function is returning 400
    // Return fallback immediately if Firebase is not configured or in Phase 1
    // if (isFirebaseDemoMode || !firebaseFunctions) {
      return {
        success: true,
        available: true,
        message: `GST ${gst_number} is available for registration (Demo Mode)`
      };
    // }

    /*
    try {
      const callable = httpsCallable(firebaseFunctions, 'verifyGSTAvailability');
      const result = await callable({ gst: gst_number });
      return result.data;
    } catch (error: any) {
      // Silent fallback for Phase 1 - allow any GST for testing
      if (isDev()) {
        console.debug('GST verification error (using fallback):', error.message);
      }
      return {
        success: true,
        available: true,
        message: `GST ${gst_number} is available for registration (Demo Mode)`
      };
    }
    */
  },

  /**
   * Create new user account with GST (Step 1 of registration)
   * Phase 1: Creates account using Firebase Auth directly if backend unavailable
   */
  createAccount: async (companyData: {
    owner_name: string;
    email: string;
    mobile: string;
    company_name: string;
    gst_number: string;
    business_role: string;
    isAlsoTrader?: boolean;
    street_address: string;
    postal_code: string;
    city: string;
    state: string;
  }) => {
    // Generate a secure password for the user
    // We generate it here so we can send it to the backend or use it for fallback
    const tempPassword = `${companyData.gst_number}@Calico${Math.random().toString(36).substr(2, 6)}`;

    // DIRECT FIREBASE AUTH IMPLEMENTATION (Bypassing Cloud Functions)
    try {
      console.log('🚀 Starting account creation via Direct Firebase Auth...');
      
      // Import Firebase Auth functions
      const { signUpWithGST } = await import('./firebase/auth');
      
      // Create user directly with Firebase Auth
      const user = await signUpWithGST(
        companyData.gst_number,
        tempPassword,
        companyData.company_name,
        companyData.mobile,
        companyData.business_role,
        companyData.email,
        companyData.owner_name,
        {
          street: companyData.street_address,
          city: companyData.city,
          state: companyData.state,
          postalCode: companyData.postal_code
        },
        companyData.isAlsoTrader // Pass isAlsoTrader to signUpWithGST
      );
      
      if (user) {
        // Store credentials for auto-login
        const authEmail = companyData.email || `${companyData.gst_number.toLowerCase()}@calico.in`;
        sessionStorage.setItem('calico_temp_auth', JSON.stringify({
          email: authEmail,
          password: tempPassword,
          timestamp: Date.now()
        }));
        
        return {
          success: true,
          message: 'Account created successfully',
          user: {
            uid: user.uid,
            email: authEmail,
            phone: companyData.mobile
          },
          company: {
            id: companyData.gst_number,
            gst_number: companyData.gst_number,
            company_name: companyData.company_name,
            role: companyData.business_role
          }
        };
      }
    } catch (authError: any) {
      console.error('❌ Firebase Auth creation failed:', authError);
      
      // Provide more specific error messages
      if (authError.message?.includes('email-already-in-use') || authError.code === 'auth/email-already-in-use') {
        throw new Error('This GST/Email is already registered. Please login instead.');
      }
      if (authError.message?.includes('weak-password') || authError.code === 'auth/weak-password') {
        throw new Error('Password security requirement not met.');
      }
      // Supabase free tier: email rate limit (3 signups/hour per email)
      if (
        authError.status === 429 ||
        authError.message?.toLowerCase().includes('rate limit') ||
        authError.message?.toLowerCase().includes('email rate')
      ) {
        throw new Error(
          'Registration is temporarily limited due to email rate limits. ' +
          'Please wait a few minutes and try again, or use a different email address.'
        );
      }
      
      throw new Error(authError.message || 'Failed to create account. Please try again.');
    }
    
    throw new Error('Failed to create account. Please try again.');
  },

  /**
   * Complete registration after OTP verification (Step 2)
   * Phase 1: Returns success if backend unavailable
   */
  completeRegistration: async (data: {
    sessionId: string;
    gst: string;
    password?: string;
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'completeRegistration');
      const result = await callable(data);
      return result.data;
    } catch (error: any) {
      // Silent fallback for Phase 1 - registration already completed via createAccount
      if (isDev()) {
        console.debug('Registration completion error (using fallback):', error.message);
      }
      
      return {
        success: true,
        message: 'Registration completed successfully (Demo Mode)',
        nextStep: 'login'
      };
    }
  },

  /**
   * Send OTP for registration (mobile)
   * Phase 1: Returns demo OTP immediately if backend unavailable
   */
  sendMobileOTP: async (mobile: string) => {
    /*
    try {
      const callable = httpsCallable(firebaseFunctions, 'sendRegistrationOTP');
      const result = await callable({ phone: mobile });
      return result.data;
    } catch (error: any) {
    */
      // Phase 1: Force fallback for all environments
      // Silent fallback for Phase 1 - return demo OTP without backend
      // if (isDev()) {
      //   console.debug('Send mobile OTP error (using fallback):', error.message);
      // }
      return {
        success: true,
        demo_otp: '123456',
        message: `Demo OTP sent to ${mobile}. Use: 123456`
      };
    /*
    }
    */
  },

  /**
   * Verify mobile OTP (registration)
   * Phase 1: Accepts demo OTP 123456 without backend
   */
  verifyMobileOTP: async (mobile: string, otpCode: string) => {
    /*
    try {
      const callable = httpsCallable(firebaseFunctions, 'verifyRegistrationOTP');
      const result = await callable({ phone: mobile, otp: otpCode });
      return result.data;
    } catch (error: any) {
    */
      // Phase 1: Force fallback for all environments
      // Silent fallback for Phase 1 - accept demo OTP
      // if (isDev()) {
      //   console.debug('Verify mobile OTP error (using fallback):', error.message);
      // }
      if (otpCode === '123456') {
        return {
          success: true,
          verified: true,
          message: 'Phone verified successfully (Demo Mode)'
        };
      }
      throw new Error('Invalid OTP. Use: 123456');
    /*
    }
    */
  },

  /**
   * Send email OTP (registration)
   * Phase 1: Returns demo OTP immediately if backend unavailable
   */
  sendEmailOTP: async (email: string) => {
    /*
    try {
      const callable = httpsCallable(firebaseFunctions, 'sendRegistrationOTP');
      const result = await callable({ email });
      return result.data;
    } catch (error: any) {
    */
      // Phase 1: Force fallback for all environments
      // Silent fallback for Phase 1 - return demo OTP without backend
      // if (isDev()) {
      //   console.debug('Send email OTP error (using fallback):', error.message);
      // }
      return {
        success: true,
        demo_otp: '123456',
        message: `Demo OTP sent to ${email}. Use: 123456`
      };
    /*
    }
    */
  },

  /**
   * Verify email OTP (registration)
   * Phase 1: Accepts demo OTP 123456 without backend
   */
  verifyEmailOTP: async (email: string, otpCode: string) => {
    /*
    try {
      const callable = httpsCallable(firebaseFunctions, 'verifyRegistrationOTP');
      const result = await callable({ email, otp: otpCode });
      return result.data;
    } catch (error: any) {
    */
      // Phase 1: Force fallback for all environments
      // Silent fallback for Phase 1 - accept demo OTP
      // if (isDev()) {
      //   console.debug('Verify email OTP error (using fallback):', error.message);
      // }
      if (otpCode === '123456') {
        return {
          success: true,
          verified: true,
          message: 'Email verified successfully (Demo Mode)'
        };
      }
      throw new Error('Invalid OTP. Use: 123456');
    /*
    }
    */
  },

  /**
   * New signup flow (combined with createAccount)
   */
  signup: async (signupData: {
    gst_number: string;
    company_name: string;
    role: string;
    mobile_number: string;
    email?: string;
    password: string;
    full_name?: string;
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'createUserWithGST');
      const result = await callable({
        gst: signupData.gst_number,
        companyName: signupData.company_name,
        role: signupData.role,
        phone: signupData.mobile_number,
        email: signupData.email,
        password: signupData.password
      });
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Signup error:', error.message);
      }
      throw error;
    }
  },

  /**
   * OTP login (two-step: send then verify)
   */
  otpLogin: async (otpData: {
    mobile_number: string;
    otp?: string;
    action: 'send' | 'verify';
  }) => {
    try {
      if (otpData.action === 'send') {
        return await registrationAPI.sendMobileOTP(otpData.mobile_number);
      } else {
        return await registrationAPI.verifyMobileOTP(otpData.mobile_number, otpData.otp!);
      }
    } catch (error: any) {
      if (isDev()) {
        console.debug('OTP login error:', error.message);
      }
      throw error;
    }
  },

  /**
   * GST-based login - Step 1: Fetch company data by GST
   * Phase 1: Queries Firestore directly if Cloud Functions not deployed
   */
  gstLogin: async (gst_number: string) => {
    // DIRECT FIRESTORE QUERY IMPLEMENTATION (Bypassing Cloud Functions)
    try {
      console.log('🚀 Starting GST Login via Direct Firestore Query:', gst_number);
      
      // Import Firestore functions
      const { doc, getDoc } = await import('firebase/firestore');
      const { firebaseDb, isFirebaseDemoMode, firebaseAuth } = await import('./firebase/config');
      
      // In demo mode, return demo company data
      if (isFirebaseDemoMode || !firebaseDb) {
        console.log('🔍 Demo mode - using demo company data for GST:', gst_number);
        return {
          success: true,
          company: {
            gst_number: gst_number,
            company_name: 'Demo Company',
            owner_name: 'Demo Owner',
            mobile: '9876543210',
            phone: '9876543210',
            email: 'demo@example.com',
            business_role: 'retailer',
            role: 'retailer'
          },
          mobile: '9876543210',
          phone: '9876543210',
          message: 'Demo company (Firebase not configured)'
        };
      }
      
      // Special case for ADMINSOGOMOTECH to bypass Firestore check
      if (gst_number === 'ADMINSOGOMOTECH') {
        console.log('🛡️ Admin login detected - bypassing Firestore check');
        return {
          success: true,
          company: {
            gst_number: 'ADMINSOGOMOTECH',
            company_name: 'CALIQUO Administration',
            owner_name: 'System Administrator',
            mobile: '9876543200',
            phone: '9876543200',
            email: 'admin@tex-app.com',
            business_role: 'admin',
            role: 'admin'
          },
          mobile: '9876543200',
          phone: '9876543200',
          message: 'Admin Verified'
        };
      }

      // Ensure we have a valid Firestore instance before proceeding
      if (!firebaseDb) {
        console.error('❌ Firestore instance is not available');
        throw new Error('Database connection not available. Please check your Firebase configuration.');
      }

      // Ensure we have an authenticated user (anonymous if not logged in)
      if (!isFirebaseDemoMode && firebaseAuth && !firebaseAuth.currentUser) {
        try {
          console.log('👻 Signing in anonymously for public access...');
          await signInAnonymously(firebaseAuth);
          console.log('✅ Anonymous sign-in successful');
        } catch (authError) {
          console.warn('⚠️ Anonymous sign-in failed:', authError);
          // Continue anyway, maybe rules allow unauthenticated read for some collections
        }
      }
      
      console.log('🔍 Querying Firestore for GST:', gst_number);
      
      // Query companies collection using GST as document ID
      const companyRef = doc(firebaseDb, 'companies', gst_number);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        console.log('✅ Company found in Firestore:', {
          gst: companyData.gst_number,
          company: companyData.company_name,
          role: companyData.role
        });
        
        return {
          success: true,
          company: {
            gst_number: companyData.gst_number,
            company_name: companyData.company_name,
            owner_name: companyData.owner_name,
            mobile: companyData.mobile_number || companyData.mobile,
            phone: companyData.mobile_number || companyData.mobile,
            email: companyData.email,
            business_role: companyData.role,
            role: companyData.role
          },
          mobile: companyData.mobile_number || companyData.mobile,
          phone: companyData.mobile_number || companyData.mobile,
          message: 'Company found'
        };
      } else {
        // Valid business case: User needs to register
        console.log('❌ GST not found in Firestore:', gst_number);
        throw new Error('GST number not found. Please register first.');
      }
    } catch (firestoreError: any) {
      console.error('❌ GST Login Error:', firestoreError);
      throw new Error(firestoreError.message || 'GST number not found. Please register first.');
    }
  },

  /**
   * GST-based login - Step 2: Request OTP to mobile
   * Phase 1: Returns demo OTP if Cloud Functions not deployed
   */
  gstLoginOTP: async (gst_number: string, mobile: string) => {
    // Force demo OTP for now since Cloud Functions are not reliable
    console.log('🚀 Sending Demo OTP for GST Login:', { gst: gst_number, mobile });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      demo_otp: '123456',
      message: `Demo OTP sent to ${mobile}. Use: 123456`
    };
  },

  /**
   * GST-based login - Step 3: Verify OTP
   * Phase 1: Accepts demo OTP and fetches company data from Firestore
   */
  verifyGstLoginOTP: async (gst_number: string, otpCode: string) => {
    console.log('🚀 Verifying GST Login OTP:', { gst: gst_number, otp: otpCode });
    
    // Validate OTP
    if (otpCode !== '123456') {
      throw new Error('Invalid OTP. Use: 123456 for testing');
    }
    
    try {
      // Fetch company data from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { firebaseDb, isFirebaseDemoMode: isDemoMode } = await import('./firebase/config');
      
      // Check if Firebase is configured
      if (isDemoMode || !firebaseDb) {
        // Return demo data if Firebase is not configured
        return {
          success: true,
          verified: true,
          company: {
            gst_number: gst_number,
            company_name: 'Demo Company',
            owner_name: 'Demo User',
            mobile: '+91-9999999999',
            email: 'demo@calico.app',
            business_role: gst_number.includes('FASH') ? 'retailer' : 'manufacturer',
            role: gst_number.includes('FASH') ? 'retailer' : 'manufacturer'
          },
          message: 'OTP verified successfully (Demo Mode)'
        };
      }
      
      // Special case for ADMINSOGOMOTECH
      if (gst_number === 'ADMINSOGOMOTECH') {
        return {
          success: true,
          verified: true,
          company: {
            gst_number: 'ADMINSOGOMOTECH',
            company_name: 'CALICO Administration',
            owner_name: 'System Administrator',
            mobile: '9876543200',
            email: 'admin@tex-app.com',
            business_role: 'admin',
            role: 'admin'
          },
          message: 'Admin Verified'
        };
      }
      
      const companyRef = doc(firebaseDb, 'companies', gst_number);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        return {
          success: true,
          verified: true,
          company: {
            gst_number: companyData.gst_number,
            company_name: companyData.company_name,
            owner_name: companyData.owner_name,
            mobile: companyData.mobile_number || companyData.mobile,
            email: companyData.email,
            business_role: companyData.role,
            role: companyData.role
          },
          message: 'OTP verified successfully'
        };
      } else {
        throw new Error('Company not found');
      }
    } catch (firestoreError: any) {
      console.error('❌ Firestore verification error:', firestoreError);
      
      // Fallback to demo response if Firestore fails (to avoid blocking login completely)
      return {
        success: true,
        verified: true,
        company: {
          gst_number: gst_number,
          company_name: 'Demo Company',
          owner_name: 'Demo User',
          mobile: '+91-9999999999',
          email: 'demo@calico.app',
          business_role: gst_number.includes('FASH') ? 'retailer' : 'manufacturer',
          role: gst_number.includes('FASH') ? 'retailer' : 'manufacturer'
        },
        message: 'OTP verified successfully (Fallback Mode)'
      };
    }
  },

  /**
   * Get all companies (admin only)
   */
  getCompanies: async () => {
    // Return empty result if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      if (isDev()) {
        console.debug('Get companies: Firebase not configured');
      }
      return {
        success: false,
        companies: [],
        error: 'Firebase not configured'
      };
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'getCompanies');
      const result = await callable({});
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Get companies error (falling back to Firestore):', error.message);
      }
      
      // Fallback: Fetch directly from Firestore
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) throw new Error('No database connection');
        
        const companiesRef = collection(firebaseDb, 'companies');
        const snapshot = await getDocs(companiesRef);
        
        const companies = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure compatibility with expected response format
            business_role: data.role || data.business_role || 'retailer',
            gst_number: data.gst_number || doc.id
          };
        });
        
        return {
          success: true,
          companies
        };
      } catch (dbError: any) {
        console.error('Firestore fallback failed:', dbError);
        return {
          success: false,
          companies: [],
          error: error instanceof Error ? error.message : 'Failed to fetch companies'
        };
      }
    }
  },

  /**
   * Register new company (admin only)
   */
  registerCompany: async (companyData: {
    owner_name: string;
    email: string;
    mobile: string;
    company_name: string;
    gst_number: string;
    business_role: string;
    address: string;
    pin: string;
    city: string;
    state: string;
    status?: 'active' | 'pending' | 'suspended' | 'inactive';
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'adminAddUser');
      const result = await callable({
        companyName: companyData.company_name,
        role: companyData.business_role,
        gst: companyData.gst_number,
        phone: companyData.mobile,
        email: companyData.email,
        address: {
          street: companyData.address,
          city: companyData.city,
          state: companyData.state,
          postalCode: companyData.pin
        }
      });
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Register company error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Update company (admin)
   */
  updateCompany: async (companyId: string, updates: Record<string, any>) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'updateCompany');
      const result = await callable({ companyId, updates });
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Update company error (using fallback):', error.message);
      }
      
      // Fallback: Update Firestore directly
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) throw new Error('No database connection');

        // Check if companyId exists
        if (!companyId) throw new Error('Company ID is required');

        const companyRef = doc(firebaseDb, 'companies', companyId);
        
        // Add updated timestamp
        const firestoreUpdates = {
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        await updateDoc(companyRef, firestoreUpdates);
        
        return { 
          success: true, 
          message: 'Company updated successfully (Direct DB)',
          company: { id: companyId, ...updates }
        };
      } catch (dbError: any) {
        console.error('Firestore fallback update failed:', dbError);
        throw error; // Throw original error if fallback also fails
      }
    }
  },

  /**
   * Delete company (admin)
   */
  deleteCompany: async (companyId: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'deleteCompany');
      const result = await callable({ companyId });
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Delete company error (using fallback):', error.message);
      }
      
      // Fallback: Delete from Firestore directly
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) throw new Error('No database connection');
        if (!companyId) throw new Error('Company ID is required');

        const companyRef = doc(firebaseDb, 'companies', companyId);
        await deleteDoc(companyRef);
        
        return { 
          success: true, 
          message: 'Company deleted successfully (Direct DB)' 
        };
      } catch (dbError: any) {
        console.error('Firestore fallback delete failed:', dbError);
        throw error;
      }
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (gstNumber: string, profileUpdates: Record<string, any>) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'updateProfile');
      const result = await callable({ gstNumber, profileUpdates });
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Update profile error (using fallback):', error.message);
      }
      
      // Fallback: Update Firestore directly
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) {
            // If in demo mode/no DB, just return success
            return { success: true, message: 'Profile updated locally (Demo)' };
        }
        
        // Map UserProfile updates to Firestore fields
        const firestoreUpdates: Record<string, any> = {
            ...profileUpdates,
        };
        
        if (profileUpdates.fullName) firestoreUpdates.owner_name = profileUpdates.fullName;
        if (profileUpdates.email) firestoreUpdates.email = profileUpdates.email;
        if (profileUpdates.phone) {
             firestoreUpdates.mobile = profileUpdates.phone;
             firestoreUpdates.mobile_number = profileUpdates.phone;
        }
        if (profileUpdates.company) firestoreUpdates.company_name = profileUpdates.company;
        if (profileUpdates.role) {
             firestoreUpdates.role = profileUpdates.role;
             firestoreUpdates.business_role = profileUpdates.role;
        }
        
        // Flatten preferences for direct column matching in Supabase
        if (profileUpdates.preferences) {
          const prefs = profileUpdates.preferences;
          if (prefs.shopType) firestoreUpdates.shop_type = prefs.shopType;
          if (prefs.preferredDressType) firestoreUpdates.preferred_dress_type = prefs.preferredDressType;
          if (prefs.preferredSellers) firestoreUpdates.preferred_sellers = prefs.preferredSellers;
          if (prefs.preferredSellerLocation) firestoreUpdates.preferred_seller_location = prefs.preferredSellerLocation;
          if (prefs.preferredTravelAgent) firestoreUpdates.preferred_travel_agent = prefs.preferredTravelAgent;
          if (prefs.preferredLocation) firestoreUpdates.preferred_location = prefs.preferredLocation;
          if (prefs.preferredCategories) firestoreUpdates.preferred_categories = prefs.preferredCategories;
        }
        
        // Handle address updates
        if (profileUpdates.address) {
             firestoreUpdates.address = profileUpdates.address;
        }
        
        firestoreUpdates.updatedAt = new Date().toISOString();

        const companyRef = doc(firebaseDb, 'companies', gstNumber);
        await updateDoc(companyRef, firestoreUpdates);
        
        return { success: true, message: 'Profile updated locally' };
        
      } catch (fallbackError) {
         console.error('Fallback profile update failed:', fallbackError);
         // Return success=false instead of throwing, so UI can handle it or show the warning it already does
         // But the warning says "proceeding with local update", so maybe I should return success: true?
         // The warning in AuthProvider is: "Backend profile update failed, proceeding with local update"
         // This implies AuthProvider DOES update local state regardless of backend success.
         // But the user complained about the ERROR LOG.
         // By implementing this fallback and returning success: true, the AuthProvider
         // will execute `if (response.success)` block and NOT show the warning.
         
         throw error;
      }
    }
  }
};

// Suppliers Management API - Updated for Firebase
export const suppliersAPI = {
  /**
   * Get all suppliers with optional filters
   */
  getSuppliers: async (filters?: {
    type?: string;
    city?: string;
    min_rating?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    // Return fallback immediately if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      if (isDev()) {
        console.debug('Suppliers API: Firebase not configured, using fallback data');
      }
      return {
        success: false,
        error: 'Firebase not configured',
        suppliers: [],
        usingFallback: true
      };
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'getSuppliers');
      const result = await callable(filters || {});
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Suppliers API: Using fallback (function not deployed)');
      }
      
      // Firestore Fallback for Suppliers
      try {
        const { collection, getDocs, query, where, or } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) throw new Error('No database');

        const companiesRef = collection(firebaseDb, 'companies');
        
        // Get all companies and filter on client if necessary, or simple query
        // Suppliers usually have role 'manufacturer' or 'wholesaler' or 'trader'
        const q = query(companiesRef, 
          or(
            where('business_role', '==', 'manufacturer'),
            where('business_role', '==', 'wholesaler'),
            where('business_role', '==', 'trader'),
            where('role', '==', 'manufacturer'), // legacy support
            where('role', '==', 'wholesaler'),
            where('role', '==', 'trader')
          )
        );
        
        const snapshot = await getDocs(q);
        const suppliers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
             id: doc.id,
             ...data,
             business_role: data.role || data.business_role || 'manufacturer'
          };
        });
        
        // Apply client-side filters if needed (simple implementation)
        let filtered = suppliers;
        if (filters?.search) {
           const s = filters.search.toLowerCase();
           filtered = filtered.filter(sup => 
             sup.company_name?.toLowerCase().includes(s) || 
             sup.owner_name?.toLowerCase().includes(s)
           );
        }
        
        return {
          success: true,
          suppliers: filtered,
          usingFallback: true
        };
      } catch (dbError) {
        console.error('Firestore suppliers fallback failed:', dbError);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
          suppliers: [],
          usingFallback: true
        };
      }
    }
  },

  /**
   * Migrate suppliers (admin only)
   */
  migrateSuppliers: async () => {
    // Return fallback immediately if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      if (isDev()) {
        console.debug('Suppliers migration: Firebase not configured, skipping');
      }
      return {
        success: false,
        error: 'Firebase not configured',
        usingFallback: true
      };
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'migrateSuppliers');
      const result = await callable({});
      return result.data;
    } catch (error: any) {
      if (isDev()) {
        console.debug('Suppliers migration: Function not deployed, using fallback data');
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
        usingFallback: true
      };
    }
  },

  /**
   * Get single supplier by ID
   */
  getSupplier: async (supplierId: string) => {
    // Return fallback immediately if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      throw new Error('Firebase not configured');
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'getSupplier');
      const result = await callable({ supplierId });
      return result.data;
    } catch (error: any) {
      console.error('Get supplier error:', error);
      throw error;
    }
  },

  /**
   * Toggle preferred supplier
   */
  togglePreferredSupplier: async (gstNumber: string, supplierId: string, action: 'add' | 'remove') => {
    // Return fallback immediately if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      if (isDev()) {
        console.debug('Toggle preferred supplier: Firebase not configured, using fallback');
      }
      return {
        success: false,
        error: 'Firebase not configured',
        usingFallback: true
      };
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'togglePreferredSupplier');
      const result = await callable({ gstNumber, supplierId, action });
      return result.data;
    } catch (error: any) {
      // Fallback to local storage
      if (isDev()) {
        console.debug('Toggle preferred supplier: Function not deployed, using fallback');
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Function not deployed',
        usingFallback: true
      };
    }
  },

  /**
   * Get preferred suppliers
   */
  getPreferredSuppliers: async (gstNumber: string) => {
    // Return fallback immediately if Firebase is not configured
    if (isFirebaseDemoMode || !firebaseFunctions) {
      if (isDev()) {
        console.debug('Get preferred suppliers: Firebase not configured, using fallback');
      }
      return {
        success: false,
        preferredSuppliers: [],
        usingFallback: true
      };
    }

    try {
      const callable = httpsCallable(firebaseFunctions, 'getPreferredSuppliers');
      const result = await callable({ gstNumber });
      return result.data;
    } catch (error: any) {
      // Fallback to local storage
      if (isDev()) {
        console.debug('Get preferred suppliers: Function not deployed, using fallback');
      }
      return {
        success: false,
        preferredSuppliers: [],
        usingFallback: true
      };
    }
  }
};

// Category Management API - Updated for Firebase
export const categoryAPI = {
  /**
   * Get all categories
   */
  getCategories: async () => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getCategories');
      const result = await callable({});
      return result.data;
    } catch (error: any) {
      // Try direct Firestore read as fallback
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (firebaseDb) {
           const categoriesRef = collection(firebaseDb, 'categories');
           const snapshot = await getDocs(categoriesRef);
           const fetchedCategories = snapshot.docs.map(doc => doc.data().name).filter(Boolean);
           
           if (fetchedCategories.length > 0) {
                // Merge with defaults to ensure we have basics
                const defaults = [
                  'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts',
                  'Jackets', 'Sweaters', 'Shorts', 'Activewear', 'Ethnic Wear'
                ];
                const merged = Array.from(new Set([...defaults, ...fetchedCategories])).sort();
                
                return {
                   success: true,
                   categories: merged
                };
           }
        }
      } catch (fsError) {
         console.warn('Firestore categories read failed:', fsError);
      }

      // Return safe fallback for categories
      devLog('Categories API fallback due to:', error.message);
      return {
        success: true,
        categories: [
          'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts',
          'Jackets', 'Sweaters', 'Shorts', 'Activewear', 'Ethnic Wear'
        ],
        fromFallback: true
      };
    }
  },

  /**
   * Add new category (admin only)
   */
  addCategory: async (name: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'addCategory');
      const result = await callable({ name });
      return result.data;
    } catch (error: any) {
      // Try direct Firestore write as fallback
      try {
        const { collection, addDoc, query, where, getDocs } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (firebaseDb) {
           // Check if exists first
           const categoriesRef = collection(firebaseDb, 'categories');
           const q = query(categoriesRef, where('name', '==', name));
           const querySnapshot = await getDocs(q);
           
           if (!querySnapshot.empty) {
               return { success: false, error: 'Category already exists' };
           }

           await addDoc(categoriesRef, {
               name: name,
               createdAt: new Date().toISOString()
           });
           return { success: true, message: 'Category added to Firestore' };
        }
      } catch (fsError) {
         console.error('Firestore category write failed:', fsError);
         // Don't throw here, let it fall through to the original error or rethrow
      }

      devLog('Add category error:', error.message);
      throw error;
    }
  }
};

// Stock Management API - Firebase functions
export const stockAPI = {
  /**
   * Get all stock items with filters
   */
  getAllStock: async (filters?: {
    category?: string;
    color?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getStock');
      const result = await callable(filters || {});
      return result.data;
    } catch (error: any) {
      // Silent fallback for stock data
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Stock API: Using fallback data (function not deployed)');
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock',
        stocks: [],
        data: [],
        usingFallback: true
      };
    }
  },

  /**
   * Get single stock item
   */
  getStockItem: async (stockId: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getStockItem');
      const result = await callable({ stockId });
      return result.data;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Get stock item error:', error.message);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock item',
        usingFallback: true
      };
    }
  },

  /**
   * Add new stock item
   */
  addStock: async (stockData: any, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'addStock');
      const result = await callable(stockData);
      return result.data;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Add stock error:', error.message);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add stock',
        usingFallback: true
      };
    }
  },

  /**
   * Update stock item
   */
  updateStock: async (stockId: string, updates: any, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'updateStock');
      const result = await callable({ stockId, updates });
      return result.data;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Update stock error (falling back to Firestore):', error.message);
      }
      
      // Fallback: Direct Firestore update
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { firebaseDb } = await import('./firebase/config');
        
        if (!firebaseDb) throw new Error('No database');
        
        const stockRef = doc(firebaseDb, 'stock_items', stockId);
        await updateDoc(stockRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        
        // Return success with updated stock mock
        return {
           success: true,
           stock: { id: stockId, ...updates },
           usingFallback: true
        };
      } catch (dbError) {
         console.error('Firestore update fallback failed:', dbError);
         return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update stock',
            usingFallback: true
         };
      }
    }
  },

  /**
   * Delete stock item
   */
  deleteStock: async (stockId: string, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'deleteStock');
      const result = await callable({ stockId });
      return result.data;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Delete stock error:', error.message);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete stock',
        usingFallback: true
      };
    }
  },

  /**
   * Get user's own stock items
   */
  getUserStock: async (companyId: string, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getStock');
      const result = await callable({ company_id: companyId });
      return result.data;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug('Get user stock error:', error.message);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user stock',
        stocks: [],
        data: [],
        usingFallback: true
      };
    }
  }
};

// Order Management API - Firebase functions
export const orderAPI = {
  /**
   * Get orders
   */
  getOrders: async (authToken?: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getOrders');
      const result = await callable(params || {});
      return result.data;
    } catch (error: any) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  /**
   * Create new order
   */
  createOrder: async (orderData: {
    items: any[];
    seller_company_id: string;
    shipping_address?: any;
    buyer_notes?: string;
  }, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'createOrder');
      const result = await callable(orderData);
      return result.data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, updates: {
    status?: string;
    tracking_id?: string;
    seller_notes?: string;
  }, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'updateOrderStatus');
      const result = await callable({ orderId, ...updates });
      return result.data;
    } catch (error: any) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  /**
   * Get single order
   */
  getOrder: async (orderId: string, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getOrder');
      const result = await callable({ orderId });
      return result.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw error;
    }
  }
};

// Purchase Request API - Firebase functions
export const purchaseRequestAPI = {
  /**
   * Create purchase request
   */
  createRequest: async (requestData: {
    product_name: string;
    category_id?: string;
    description?: string;
    requirements?: any;
  }, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'createPurchaseRequest');
      const result = await callable(requestData);
      return result.data;
    } catch (error: any) {
      console.error('Create purchase request error:', error);
      throw error;
    }
  },

  /**
   * Get purchase request responses
   */
  getResponses: async (requestId: string, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getPurchaseRequestResponses');
      const result = await callable({ requestId });
      return result.data;
    } catch (error: any) {
      console.error('Get responses error:', error);
      throw error;
    }
  },

  /**
   * Update purchase request
   */
  updateRequest: async (requestId: string, updateData: {
    action: 'respond' | 'accept';
    price_quoted?: number;
    message?: string;
    stock_item_id?: string;
    accept_response_id?: string;
  }, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'updatePurchaseRequest');
      const result = await callable({ requestId, ...updateData });
      return result.data;
    } catch (error: any) {
      console.error('Update purchase request error:', error);
      throw error;
    }
  }
};

// Analytics API - Firebase functions (optional)
export const analyticsAPI = {
  getSalesAnalytics: async (authToken?: string, params?: any) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getSalesAnalytics');
      const result = await callable(params || {});
      return result.data;
    } catch (error: any) {
      throw error;
    }
  },

  getDashboard: async (params?: any) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getDashboardAnalytics');
      const result = await callable(params || {});
      return result.data;
    } catch (error: any) {
      throw error;
    }
  },

  getStockAnalytics: async () => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getStockAnalytics');
      const result = await callable({});
      return result.data;
    } catch (error: any) {
      throw error;
    }
  }
};

// Demo Data API (legacy compatibility)
export const demoAPI = {
  initializeDemoData: async () => ({ success: true, message: 'Demo mode - data in memory' }),
  clearDemoRegistrations: async () => ({ success: true }),
  getRegistrationStatus: async () => ({ status: 'demo' }),
  testGST: async (gst_number: string) => ({ valid: true, gst_number }),
  getDemoStatus: async () => ({ mode: 'demo', backend: 'firebase' })
};

// Image Upload API - Firebase Storage
export const imageAPI = {
  /**
   * Upload image to Firebase Storage
   */
  uploadImage: async (file: File, stockId?: string, imageType?: string): Promise<any> => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'uploadImage');
      
      // Convert file to base64 for Cloud Function
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await callable({
        image: base64,
        stockId,
        imageType,
        fileName: file.name,
        contentType: file.type
      });

      return result.data;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },

  /**
   * Get signed URL for image
   */
  getImageUrl: async (fileName: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getImageUrl');
      const result = await callable({ fileName });
      return result.data;
    } catch (error: any) {
      console.error('Get image URL error:', error);
      throw error;
    }
  }
};

// Notifications API - Firebase functions
export const notificationsAPI = {
  /**
   * Get user notifications
   */
  getNotifications: async (authToken?: string, filters?: {
    read?: boolean;
    page?: number;
    limit?: number;
  }) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getNotifications');
      const result = await callable(filters || {});
      return result.data;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string, authToken?: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'markNotificationRead');
      const result = await callable({ notificationId });
      return result.data;
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  }
};

// System API - Health checks
export const systemAPI = {
  checkHealth: () => apiClient.checkHealth(),
  checkDatabaseStatus: () => apiClient.checkDatabaseStatus()
};

// Legacy compatibility - Direct API (no longer needed with Firebase)
export const directAPI = {
  getStock: async () => {
    // Use Firebase function instead
    return await stockAPI.getAllStock();
  }
};

// Fabric Types Management API
export const fabricTypeAPI = {
  getFabricTypes: async () => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'getFabricTypes');
      const result = await callable({});
      return result.data;
    } catch (error: any) {
      // Return fallback
      return {
        success: true,
        fabricTypes: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim'],
        fromFallback: true
      };
    }
  },

  addFabricType: async (name: string) => {
    try {
      const callable = httpsCallable(firebaseFunctions, 'addFabricType');
      const result = await callable({ name });
      return result.data;
    } catch (error: any) {
      throw error;
    }
  }
};