import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { registrationAPI } from '../../utils/api-supabase';
import { simpleTimeout } from '../utils/simple-timeout';

export type UserRole = 'manufacturer' | 'trader' | 'retailer' | 'financial' | 'logistics-agent' | 'admin' | 'super-admin';
export type BusinessCategory = 'manufacturer' | 'trader' | 'retailer' | 'agent';

export type RetailerType = 'single-shop' | 'multi-shop';

export interface UserPreferences {
  preferredCategories?: string[];
  preferredLocation?: string;
  preferredCity?: string;
  preferredState?: string;
  shopType?: string;
  preferredDressType?: string;
  preferredSellers?: string;
  preferredSellerLocation?: string;
  preferredTravelAgent?: string;
  preferredFinancialAgent?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string; // For business communication
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  role: UserRole;
  businessCategory: BusinessCategory;
  isAlsoTrader?: boolean; // For financial agents who also trade
  retailerType?: RetailerType; // Required for retailers only
  company: string;
  gstNumber: string; // Required for business authentication
  panNumber?: string;
  language: 'en' | 'hi' | 'ml' | 'ta' | 'te' | 'gu' | 'kn' | 'bn';
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  businessType?: 'single_shop' | 'multi_shop';
  profile: UserProfile;
}

interface AuthContextType {
  user: User | null;
  login: (gstNumber: string, password: string, role: UserRole) => Promise<boolean>;
  register: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  getCompanyByGST: (gstNumber: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimized user session loading with aggressive timeouts
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // Fast session check without logging
        const storedUser = sessionStorage.getItem('tex-app-user');
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData?.id) {
              // FIX: Invalidate session if ID is random string (9 chars) and not a valid GST or known ID
              // GST is 15 chars. Random ID was 9 chars.
              // This ensures users re-login to get the stable GST-based ID
              const isLegacyRandomId = userData.id.length < 10 && userData.id !== 'admin-001';
              
              if (isLegacyRandomId) {
                  console.log('Detected legacy random session ID, forcing logout to fix My Stock issue');
                  sessionStorage.removeItem('tex-app-user');
                  sessionStorage.removeItem('tex-app-session');
                  setIsLoading(false);
                  return;
              }

              setUser(userData);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            // Clear corrupted data silently
            sessionStorage.removeItem('tex-app-user');
            sessionStorage.removeItem('tex-app-session');
          }
        }
        
        // No user found - set loading to false and show login screen
        setIsLoading(false);
        
      } catch (error) {
        setIsLoading(false);
      }
    };

    // Immediate execution for faster startup
    loadUserFromStorage();
  }, []);

  const login = async (gstNumber: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      console.log('AuthProvider.login called with:', { gstNumber, password, role });
      
      // Special case for admin login
      console.log('AuthProvider.login: Checking admin conditions:', {
        role,
        expectedRole: 'admin or super-admin',
        roleMatch: role === 'admin' || role === 'super-admin',
        gstNumber,
        expectedGST: 'ADMINSOGOMOTECH or SUPERADMIN123', 
        gstMatch: gstNumber === 'ADMINSOGOMOTECH' || gstNumber === 'SUPERADMIN123',
        password,
        expectedPassword: 'admin-password-verified or super-admin-verified',
        passwordMatch: password === 'admin-password-verified' || password === 'super-admin-verified'
      });
      
      if ((role === 'admin' && gstNumber === 'ADMINSOGOMOTECH' && password === 'admin-password-verified') ||
          (role === 'super-admin' && gstNumber === 'SUPERADMIN123' && password === 'super-admin-verified')) {
        console.log('Admin login conditions matched, creating admin user...');
        const isAdmin = role === 'admin';
        const mockProfile: UserProfile = {
          id: isAdmin ? 'admin-001' : 'super-admin-001',
          fullName: isAdmin ? 'System Administrator' : 'Super Administrator',
          email: isAdmin ? 'admin@tex-app.com' : 'superadmin@tex-app.com',
          phone: isAdmin ? '+91 98765 43200' : '+91 98765 43201',
          address: {
            street: 'CALIQUO HQ',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
          },
          role: role,
          businessCategory: 'agent',
          company: isAdmin ? 'CALIQUO Administration' : 'CALIQUO Super Administration',
          gstNumber: gstNumber,
          panNumber: isAdmin ? 'ADMIN1234X' : 'SUPER1234X',
          language: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockUser: User = {
          id: mockProfile.id,
          name: mockProfile.fullName,
          email: mockProfile.email,
          role: mockProfile.role,
          company: mockProfile.company,
          profile: mockProfile
        };
        
        // Save user data to sessionStorage
        try {
          sessionStorage.setItem('tex-app-user', JSON.stringify(mockUser));
          sessionStorage.setItem('tex-app-session', JSON.stringify({
            loginTime: new Date().toISOString(),
            gstNumber: gstNumber,
            role: role
          }));
        } catch (error) {
          console.error('Failed to save user to storage:', error);
        }
        
        console.log('Setting admin user:', mockUser);
        setUser(mockUser);
        console.log('Admin login successful, returning true');
        return true;
      }

      // For OTP-verified login, verify with backend and retrieve user data
      if (password === 'otp-verified') {
        console.log('Login attempt with verified OTP for GST:', gstNumber);
        
        try {
          // Get company data from backend using GST number with simple timeout
          const gstLoginResponse = await simpleTimeout(
            registrationAPI.gstLogin(gstNumber),
            4000,
            'GST login API request timed out'
          );
          
          if (gstLoginResponse.success && gstLoginResponse.company) {
            // Create user profile from company data with proper null checks
            const companyData = gstLoginResponse.company;
            // Prioritize user-selected role during login over backend role
            const businessRole = role || companyData.business_role || companyData.role || 'retailer';
            // Use GST Number as the stable User ID to ensure data persistence across sessions
            // This fixes the issue where random IDs caused "My Stock" to be empty after relogin
            const stableUserId = gstNumber;
            
            const userProfile: UserProfile = {
              id: stableUserId,
              fullName: companyData.owner_name || 'Business Owner',
              email: companyData.email || `${gstNumber.toLowerCase()}@business.com`,
              phone: companyData.mobile || companyData.mobile_number || '+91 9876543210',
              address: {
                street: '123 Business Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
                country: 'India'
              },
              role: businessRole as UserRole,
              businessCategory: businessRole === 'manufacturer' ? 'manufacturer' : 
                               businessRole === 'trader' ? 'trader' : 
                               businessRole === 'retailer' ? 'retailer' : 
                               businessRole === 'financial' ? 'agent' : 
                               businessRole === 'logistics-agent' ? 'agent' : 'agent',
              company: companyData.company_name || 'Business Company',
              gstNumber: gstNumber,
              panNumber: gstNumber.substring(2, 12), // Extract PAN from GST
              language: 'en',
              preferences: companyData.preferences || {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const authUser: User = {
              id: userProfile.id,
              name: userProfile.fullName,
              email: userProfile.email,
              role: userProfile.role,
              company: userProfile.company,
              profile: userProfile
            };
            
            // Save user data to sessionStorage
            try {
              sessionStorage.setItem('tex-app-user', JSON.stringify(authUser));
              sessionStorage.setItem('tex-app-session', JSON.stringify({
                loginTime: new Date().toISOString(),
                gstNumber: gstNumber,
                role: userProfile.role
              }));
            } catch (error) {
              console.error('Failed to save user to sessionStorage:', error);
            }
            
            setUser(authUser);
            console.log('Login successful with real data from Firestore:', authUser.company);
            return true;
          } else {
            // No company data found - this is a real error, not a demo fallback
            console.error('GST login response missing company data:', gstLoginResponse);
            throw new Error('Company data not found for this GST number');
          }
        } catch (backendError: any) {
          console.error('Login error - GST not found in database:', backendError);
          // Re-throw the error so LoginForm can handle it properly
          throw new Error(backendError.message || 'Failed to login. GST number not found.');
        }
      }
      
      // Only use demo mode for SPECIFIC demo GST numbers, not as a general fallback
      const knownDemoGSTs = [
        '27FASHR1234F1Z5',
        '29FASHCO1234F1Z5',
        '27AAECE4266B1ZP',
        '29ABCDE1234F1Z5',
        '22DEMO12345A6Z7'
      ];
      
      // Force real authentication if not using demo credentials
      const isKnownDemo = knownDemoGSTs.includes(gstNumber) && password === 'otp-verified';
      
      // IMPORTANT: If user says "no demo", we should prioritize real login
      // For now, we keep the demo fallback strictly for known demo GSTs to avoid confusion
      if (isKnownDemo) {
        console.log('Using demo mode for known demo GST:', gstNumber);
        // Extract components for demo data
        const companyCode = gstNumber.length > 7 ? gstNumber.substring(2, 7) : gstNumber;
        
        // Generate appropriate phone number based on role
        const rolePhones = {
          manufacturer: '+91 9876543210',
          retailer: '+91 9876543211', 
          trader: '+91 9876543212',
          financial: '+91 9876543214',
          'logistics-agent': '+91 9876543215',
          admin: '+91 9876543200'
        };
        
        const mockProfile: UserProfile = {
          id: gstNumber, // Use GST as stable ID
          fullName: `${companyCode} Business Owner`,
          email: `${companyCode.toLowerCase()}@business.com`,
          phone: rolePhones[role] || '+91 9876543210',
          address: {
            street: '123 Business Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
          },
          role,
          businessCategory: role === 'manufacturer' ? 'manufacturer' : 
                           role === 'trader' ? 'trader' : 
                           role === 'retailer' ? 'retailer' : 
                           role === 'financial' ? 'agent' : 
                           role === 'logistics-agent' ? 'agent' : 'agent',
          company: gstNumber === '27FASHR1234F1Z5' ? 'Fashion Retail Co.' :
                   `${companyCode} ${role.charAt(0).toUpperCase() + role.slice(1)} Corp`,
          gstNumber,
          panNumber: gstNumber.length > 10 ? gstNumber.substring(2, 12) : gstNumber, // Extract PAN from GST
          language: 'en',
          preferences: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockUser: User = {
          id: mockProfile.id,
          name: mockProfile.fullName,
          email: mockProfile.email,
          role: mockProfile.role,
          company: mockProfile.company,
          profile: mockProfile
        };
        
        // Save user data to sessionStorage
        try {
          sessionStorage.setItem('tex-app-user', JSON.stringify(mockUser));
          sessionStorage.setItem('tex-app-session', JSON.stringify({
            loginTime: new Date().toISOString(),
            gstNumber: gstNumber,
            role: role
          }));
        } catch (error) {
          console.error('Failed to save user to storage:', error);
        }
        
        setUser(mockUser);
        console.log('Demo mode login successful:', mockUser.company);
        return true;
      }
      
      // If we reach here, login failed - no demo fallback for unknown GSTs
      console.error('Login failed: GST number not found in database and not a known demo GST');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw to let the caller handle the error
      throw error;
    }
  };

  const register = async (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'businessCategory'>): Promise<boolean> => {
    try {
      console.log('Registration attempt via AuthProvider:', {
        gstNumber: profileData.gstNumber,
        company: profileData.company,
        role: profileData.role
      });

      // Build user profile directly from the registration form data (Supabase flow)
      // The createAccount() call in api-supabase already registered in Supabase Auth + companies table
      // We just need to set the local session state here.

      // Fallback to local session for compatibility
      const profile: UserProfile = {
        ...profileData,
        // Use GST Number as stable ID even in demo/fallback mode
        id: profileData.gstNumber,
        // Auto-assign businessCategory based on role
        businessCategory: profileData.role === 'manufacturer' ? 'manufacturer' : 
                         profileData.role === 'trader' ? 'trader' : 
                         profileData.role === 'retailer' ? 'retailer' : 
                         profileData.role === 'financial' ? 'agent' : 
                         profileData.role === 'logistics-agent' ? 'agent' : 'agent',
        preferences: profileData.preferences || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newUser: User = {
        id: profile.id,
        name: profile.fullName,
        email: profile.email,
        role: profile.role,
        company: profile.company,
        profile
      };

      // Save user data to sessionStorage
      try {
        sessionStorage.setItem('tex-app-user', JSON.stringify(newUser));
        sessionStorage.setItem('tex-app-session', JSON.stringify({
          loginTime: new Date().toISOString(),
          gstNumber: profile.gstNumber,
          role: profile.role
        }));
      } catch (error) {
        console.error('Failed to save user to storage:', error);
      }

      setUser(newUser);
      console.log('User registered and authenticated successfully:', newUser.company);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedProfile: UserProfile = {
        ...user.profile,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updatedUser: User = {
        ...user,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        company: updatedProfile.company,
        profile: updatedProfile
      };

      // Try to update profile in backend first
      try {
        const response = await registrationAPI.updateProfile(user.profile.gstNumber, updates);
        
        if (response.success) {
          console.log('Profile updated in backend successfully');
        } else {
          console.warn('Backend profile update failed, proceeding with local update:', response.error);
        }
      } catch (backendError) {
        console.warn('Backend profile update failed, proceeding with local update:', backendError);
        // Continue with local update even if backend fails
      }

      // Update user data in sessionStorage
      try {
        sessionStorage.setItem('tex-app-user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update user in storage:', error);
      }

      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const getCompanyByGST = async (gstNumber: string): Promise<any> => {
    try {
      // Add simple timeout protection to GST lookup
      const response = await simpleTimeout(
        registrationAPI.gstLogin(gstNumber),
        5000,
        'GST company lookup timed out'
      );
      
      if (response.success && response) {
        return {
          success: true,
          company: {
            gst_number: gstNumber,
            company_name: response.company_name || 'Business Company',
            owner_name: response.owner_name || 'Business Owner',
            business_role: response.business_role || 'retailer',
            mobile: response.mobile || '+91 9876543210',
            verified: response.verified || true
          }
        };
      }
      
      return { success: false, error: 'Company not found' };
    } catch (error) {
      console.error('Failed to get company by GST:', error);
      
      // Provide better error messaging for timeouts
      if (error instanceof Error && error.message?.includes('timed out')) {
        return { 
          success: false, 
          error: 'Request timed out. Please check your connection and try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve company data' 
      };
    }
  };

  const logout = () => {
    // Clear user data from sessionStorage
    try {
      sessionStorage.removeItem('tex-app-user');
      sessionStorage.removeItem('tex-app-session');
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
    
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    updateProfile,
    getCompanyByGST,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export types for use in other components
export type { User, UserProfile, UserRole, BusinessCategory, RetailerType };
