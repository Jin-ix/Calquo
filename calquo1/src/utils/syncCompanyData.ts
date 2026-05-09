/**
 * Utility to sync company data from user profile to Firestore companies collection
 * This is needed for users who registered before company documents were created
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseDb } from './firebase/config';

export async function syncUserToCompanyDocument(
  gstNumber: string,
  userData: {
    company_name?: string;
    owner_name?: string;
    email?: string;
    mobile?: string;
    phone?: string;
    role?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    } | string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }
): Promise<boolean> {
  if (!firebaseDb || !gstNumber) {
    console.warn('[SyncCompanyData] Firebase not configured or no GST number');
    return false;
  }

  try {
    // Check if company document already exists
    const companyRef = doc(firebaseDb, 'companies', gstNumber);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
      console.log('[SyncCompanyData] ✅ Company document already exists for GST:', gstNumber);
      return true;
    }

    console.log('[SyncCompanyData] 📝 Creating company document for GST:', gstNumber);

    // Extract address fields
    let addressObj: any = {};
    
    if (typeof userData.address === 'object' && userData.address) {
      addressObj = {
        street: userData.address.street || userData.street || '',
        city: userData.address.city || userData.city || '',
        state: userData.address.state || userData.state || '',
        postalCode: userData.address.postalCode || userData.postalCode || '',
        country: 'India'
      };
    } else if (typeof userData.address === 'string') {
      addressObj = {
        street: userData.address,
        city: userData.city || '',
        state: userData.state || '',
        postalCode: userData.postalCode || '',
        country: 'India'
      };
    }

    // Create company document
    const companyData = {
      id: gstNumber,
      gst_number: gstNumber,
      company_name: userData.company_name || 'Company',
      owner_name: userData.owner_name || userData.company_name || 'Owner',
      mobile_number: userData.mobile || userData.phone || '',
      mobile: userData.mobile || userData.phone || '',
      email: userData.email || `${gstNumber.toLowerCase()}@calico.in`,
      role: userData.role || 'retailer',
      tier: 'free',
      is_active: true,
      // Address object
      address: addressObj,
      // Individual address fields for backward compatibility
      street_address: addressObj.street,
      city: addressObj.city,
      state: addressObj.state,
      postal_code: addressObj.postalCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(companyRef, companyData);

    console.log('[SyncCompanyData] ✅ Company document created successfully:', companyData);
    return true;
  } catch (error) {
    console.error('[SyncCompanyData] ❌ Error syncing company data:', error);
    return false;
  }
}

/**
 * Auto-sync function that can be called when user logs in
 */
export async function autoSyncCompanyOnLogin(user: any): Promise<void> {
  if (!user || !user.profile) {
    return;
  }

  const gstNumber = user.profile.gstNumber || user.gstNumber || user.profile.gst_number;
  
  if (!gstNumber) {
    console.warn('[SyncCompanyData] No GST number found for user');
    return;
  }

  // Prepare user data
  const userData = {
    company_name: user.company || user.profile.company || user.businessName,
    owner_name: user.name || user.profile.fullName || user.fullName,
    email: user.email || user.profile.email,
    mobile: user.phone || user.profile.phone,
    role: user.role || user.profile.role,
    address: user.profile.address,
    city: user.profile.city,
    state: user.profile.state,
    postalCode: user.profile.postalCode
  };

  await syncUserToCompanyDocument(gstNumber, userData);
}
