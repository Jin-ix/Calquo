/**
 * CALIQUO - Firebase Authentication Provider
 * Phase 1 Testing Version with Firebase Integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGST,
  signUpWithGST,
  signOut as firebaseSignOut,
  onAuthChange,
  getUserData,
  CalicoUser
} from '../../utils/firebase/auth';
import { updateDocument } from '../../utils/firebase/firestore';

export type UserRole = 'manufacturer' | 'trader' | 'retailer' | 'financial' | 'logistics-agent' | 'admin';
export type BusinessCategory = 'manufacturer' | 'trader' | 'retailer' | 'agent';
export type RetailerType = 'single-shop' | 'multi-shop';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
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
  isAlsoTrader?: boolean;
  retailerType?: RetailerType;
  company: string;
  gstNumber: string;
  panNumber?: string;
  language: 'en' | 'hi' | 'ml' | 'ta' | 'te' | 'gu' | 'kn' | 'bn';
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

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, fetch user data from Firestore
        const userData = await getUserData(firebaseUser.uid);
        
        if (userData) {
          const user: User = {
            id: userData.uid,
            name: userData.company_name,
            email: userData.email,
            role: userData.role as UserRole,
            company: userData.company_name,
            profile: {
              id: userData.uid,
              fullName: userData.company_name,
              email: userData.email,
              phone: userData.mobile_number,
              address: {
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'India'
              },
              role: userData.role as UserRole,
              businessCategory: (userData.role === 'manufacturer' ? 'manufacturer' :
                               userData.role === 'trader' ? 'trader' :
                               userData.role === 'retailer' ? 'retailer' : 'agent') as BusinessCategory,
              company: userData.company_name,
              gstNumber: userData.gst_number,
              language: 'en',
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt || userData.updated_at
            }
          };
          
          setUser(user);
          // Also save to localStorage for offline access
          try {
            localStorage.setItem('tex-app-user', JSON.stringify(user));
          } catch (error) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
              console.warn('Failed to save user to localStorage:', error);
            }
          }
        }
      } else {
        // User is signed out
        setUser(null);
        try {
          localStorage.removeItem('tex-app-user');
          localStorage.removeItem('tex-app-session');
        } catch (error) {
          // Silent failure
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (gstNumber: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Special case for admin login (demo mode)
      if ((role === 'admin' && gstNumber === 'ADMINSOGOMOTECH' && password === 'admin-password-verified') ||
          (role === 'super-admin' && gstNumber === 'SUPERADMIN123' && password === 'super-admin-verified')) {
        const isAdmin = role === 'admin';
        const mockProfile: UserProfile = {
          id: isAdmin ? 'admin-001' : 'super-admin-001',
          fullName: isAdmin ? 'System Administrator' : 'Super Administrator',
          email: isAdmin ? 'admin@calico.in' : 'superadmin@calico.in',
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
        
        setUser(mockUser);
        localStorage.setItem('tex-app-user', JSON.stringify(mockUser));
        return true;
      }

      // Firebase authentication
      const userData = await signInWithGST(gstNumber, password);
      
      if (userData) {
        // Firebase auth state listener will handle setting the user
        return true;
      }
      
      // Fallback to demo mode for testing (Phase 1)
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && password === 'otp-verified') {
        const mockProfile: UserProfile = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: `${gstNumber} Business Owner`,
          email: `${gstNumber.toLowerCase()}@calico.in`,
          phone: '+91 9876543210',
          address: {
            street: '123 Business Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
          },
          role,
          businessCategory: (role === 'manufacturer' ? 'manufacturer' :
                           role === 'trader' ? 'trader' :
                           role === 'retailer' ? 'retailer' : 'agent') as BusinessCategory,
          company: `${gstNumber} Company`,
          gstNumber,
          panNumber: gstNumber.substring(2, 12),
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
        
        setUser(mockUser);
        localStorage.setItem('tex-app-user', JSON.stringify(mockUser));
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Login error:', error.message);
      }
      return false;
    }
  };

  const register = async (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'businessCategory'>): Promise<boolean> => {
    try {
      // Create user with Firebase
      const userData = await signUpWithGST(
        profileData.gstNumber,
        'default-password-123', // In production, this should be user-provided
        profileData.company,
        profileData.phone,
        profileData.role
      );
      
      if (userData) {
        // Firebase auth state listener will handle setting the user
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Registration error:', error.message);
      }
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

      // Update in Firestore
      const success = await updateDocument('users', user.id, {
        ...updates,
        updated_at: new Date()
      });

      if (success) {
        setUser(updatedUser);
        localStorage.setItem('tex-app-user', JSON.stringify(updatedUser));
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Profile update error:', error.message);
      }
      return false;
    }
  };

  const getCompanyByGST = async (gstNumber: string): Promise<any> => {
    try {
      // In Firebase, we'd query the companies collection
      // For now, return a placeholder
      return {
        success: false,
        error: 'GST lookup not implemented yet'
      };
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Get company by GST error:', error.message);
      }
      return {
        success: false,
        error: error.message
      };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      localStorage.removeItem('tex-app-user');
      localStorage.removeItem('tex-app-session');
    } catch (error: any) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn('Logout error:', error.message);
      }
    }
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
