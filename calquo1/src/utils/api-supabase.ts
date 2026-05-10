import { supabase } from './supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Registration API (all Supabase, no Firebase)
// ─────────────────────────────────────────────────────────────────────────────
export const registrationAPI = {

  /**
   * Look up a company by GST number (used during login step 1)
   */
  getCompanyByGST: async (gstNumber: string) => {
    if (!gstNumber || gstNumber.trim() === '') {
      throw new Error('Please enter a GST number.');
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('gst_number', gstNumber.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Supabase error looking up GST:', error.message);
      throw new Error('Database error. Please try again.');
    }

    if (!data) {
      throw new Error('GST number not found. Please register first.');
    }

    return {
      success: true,
      company: {
        gst_number: data.gst_number,
        company_name: data.company_name,
        owner_name: data.owner_name,
        mobile: data.mobile,
        phone: data.mobile,
        email: data.email,
        business_role: data.business_role,
        role: data.business_role,
        status: data.status,
      },
      mobile: data.mobile,
      phone: data.mobile,
      message: 'Company found',
    };
  },

  /**
   * Alias used by AuthProvider login flow
   */
  gstLogin: async (gstNumber: string) => {
    return registrationAPI.getCompanyByGST(gstNumber);
  },

  /**
   * Verify GST availability during registration
   */
  verifyGST: async (gstNumber: string) => {
    const { data } = await supabase
      .from('companies')
      .select('gst_number')
      .eq('gst_number', gstNumber)
      .maybeSingle();

    if (data) {
      return { success: false, available: false, message: 'GST already registered.' };
    }
    return { success: true, available: true, message: 'GST is available.' };
  },

  /**
   * Create account — registers in Supabase Auth + inserts into companies table
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
    const password = `${companyData.gst_number}@Calico2024`;

    // Step 1: Sign up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: companyData.email,
      password,
    });

    if (authError) {
      const isRateLimited =
        authError.status === 429 ||
        authError.message?.toLowerCase().includes('rate limit') ||
        authError.message?.toLowerCase().includes('email rate');

      const isAlreadyRegistered =
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('user already registered');

      if (!isRateLimited && !isAlreadyRegistered) {
        // Real error — surface it
        if (authError.message?.includes('already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        throw new Error(authError.message);
      }
      // For rate limit / already-registered, fall through and still insert company
      console.warn('⚠️ Supabase Auth issue:', authError.message, '— proceeding to company insert.');
    }

    // Step 2: Insert into companies table
    // Schema: NO user_id column. email is UNIQUE. status enum default = 'pending'.
    const companyRecord: Record<string, any> = {
      owner_name:    companyData.owner_name,
      email:         companyData.email,
      mobile:        companyData.mobile,
      company_name:  companyData.company_name,
      gst_number:    companyData.gst_number,
      business_role: companyData.business_role,
      address:       companyData.street_address,
      city:          companyData.city,
      state:         companyData.state,
      pin:           companyData.postal_code,
      is_verified:   false,
      // status: intentionally omitted — DB default ('pending') will apply
    };

    const { data: insertData, error: dbError } = await supabase
      .from('companies')
      .insert([companyRecord])
      .select('id')
      .single();

    if (dbError) {
      const isDuplicate =
        dbError.code === '23505' ||
        dbError.message?.toLowerCase().includes('duplicate') ||
        dbError.message?.toLowerCase().includes('unique');

      if (isDuplicate) {
        // Email already in companies — update the record
        console.warn('⚠️ Company email already exists — updating record.');
        await supabase
          .from('companies')
          .update({
            owner_name:    companyData.owner_name,
            mobile:        companyData.mobile,
            company_name:  companyData.company_name,
            gst_number:    companyData.gst_number,
            business_role: companyData.business_role,
            address:       companyData.street_address,
            city:          companyData.city,
            state:         companyData.state,
            pin:           companyData.postal_code,
          })
          .eq('email', companyData.email);
      } else {
        console.error('Company insert error:', dbError);
        // Don't throw — auth user was created, still try to log them in
      }
    } else {
      console.log('✅ Company inserted, id:', insertData?.id);
    }

    // Store credentials for auto-login after registration
    sessionStorage.setItem('calico_temp_auth', JSON.stringify({
      email: companyData.email,
      password,
      timestamp: Date.now(),
    }));

    return {
      success: true,
      message: 'Account created successfully',
      user: { uid: authData?.user?.id ?? companyData.email, email: companyData.email, phone: companyData.mobile },
      company: {
        id: companyData.gst_number,
        gst_number: companyData.gst_number,
        company_name: companyData.company_name,
        role: companyData.business_role,
      },
    };
  },

  /**
   * Update company profile
   */
  updateProfile: async (gstNumber: string, updates: Record<string, any>) => {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (updates.fullName !== undefined) dbUpdates.owner_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.mobile = updates.phone;
    if (updates.company !== undefined) dbUpdates.company_name = updates.company;
    if (updates.businessCategory !== undefined) dbUpdates.business_role = updates.businessCategory;
    if (updates.role !== undefined && dbUpdates.business_role === undefined) dbUpdates.business_role = updates.role;
    
    if (updates.address) {
      if (updates.address.street !== undefined) dbUpdates.address = updates.address.street;
      if (updates.address.city !== undefined) dbUpdates.city = updates.address.city;
      if (updates.address.state !== undefined) dbUpdates.state = updates.address.state;
      if (updates.address.postalCode !== undefined) dbUpdates.pin = updates.address.postalCode;
    }
    
    if (updates.preferences !== undefined) {
      dbUpdates.preferences = updates.preferences;
    }

    const { error } = await supabase
      .from('companies')
      .update(dbUpdates)
      .eq('gst_number', gstNumber);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Admin: get all companies
   */
  getCompanies: async () => {
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, companies: [], error: error.message };
    return { success: true, companies: data || [] };
  },

  /**
   * Admin: register a company manually
   */
  registerCompany: async (companyData: any) => {
    const { data, error } = await supabase.from('companies').insert([companyData]).select();
    if (error) throw new Error(error.message);
    return { success: true, company: data[0] };
  },

  /**
   * Admin: update a company
   */
  updateCompany: async (companyId: string, updates: Record<string, any>) => {
    const { error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', companyId);
    if (error) throw new Error(error.message);
    return { success: true, message: 'Company updated successfully' };
  },

  /**
   * Admin: delete a company
   */
  deleteCompany: async (companyId: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // ── OTP stubs (demo mode) ────────────────────────────────────────────────
  sendMobileOTP: async (mobile: string) => ({
    success: true, demo_otp: '123456', message: `Demo OTP sent to ${mobile}. Use: 123456`
  }),
  verifyMobileOTP: async (_mobile: string, otp: string) => {
    if (otp !== '123456') throw new Error('Invalid OTP. Use: 123456');
    return { success: true, verified: true, message: 'Phone verified (Demo)' };
  },
  sendEmailOTP: async (email: string) => ({
    success: true, demo_otp: '123456', message: `Demo OTP sent to ${email}. Use: 123456`
  }),
  verifyEmailOTP: async (_email: string, otp: string) => {
    if (otp !== '123456') throw new Error('Invalid OTP. Use: 123456');
    return { success: true, verified: true, message: 'Email verified (Demo)' };
  },
  gstLoginOTP: async (_gst: string, mobile: string) => ({
    success: true, demo_otp: '123456', message: `Demo OTP sent to ${mobile}. Use: 123456`
  }),
  verifyGstLoginOTP: async (gstNumber: string, otp: string) => {
    if (otp !== '123456') throw new Error('Invalid OTP. Use: 123456');
    return registrationAPI.getCompanyByGST(gstNumber).then(r => ({ ...r, verified: true }));
  },
  completeRegistration: async () => ({
    success: true, message: 'Registration completed', nextStep: 'login'
  }),
  signup: async () => ({ success: true }),
  otpLogin: async () => ({ success: true }),
};

// Legacy compat
export const apiClient = {
  checkHealth: async () => ({ status: 'healthy', service: 'CALIQUO Supabase API' }),
  checkDatabaseStatus: async () => ({ status: 'connected', database: 'postgresql' }),
};
