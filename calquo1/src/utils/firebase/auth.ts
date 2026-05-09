import { supabase } from '../supabase/client';

export type User = any;
export type Auth = any;

export function getAuth() { return {}; }
export function signInAnonymously(auth: any) { return Promise.resolve({ user: { uid: 'anon' } }); }
export function setPersistence(auth: any, type: any) { return Promise.resolve(); }
export const browserSessionPersistence = 'SESSION';

export async function signInWithEmailAndPassword(auth: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return { user: { uid: data.user.id } };
}

export async function createUserWithEmailAndPassword(auth: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) throw error;
  return { user: { uid: data.user?.id } };
}

export function onAuthStateChanged(auth: any, callback: (user: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
}

/**
 * Register a new company in Supabase.
 *
 * Schema facts (from the actual companies table):
 *   - Primary key: id (uuid, auto)
 *   - Unique:      email
 *   - No user_id column
 *   - status is a custom enum (user_status), default 'pending'
 *   - business_role is a custom enum (business_role_type), default 'retailer'
 *   - gst_number is plain nullable text (no unique constraint)
 */
export async function signUpWithGST(
  gst: string,
  pass: string,
  company: string,
  mobile: string,
  role: string,
  email: string,
  owner: string,
  address: any,
  isAlsoTrader?: boolean
) {
  // ── Step 1: Auth signup ────────────────────────────────────────────────────
  const { data, error } = await supabase.auth.signUp({ email, password: pass });

  if (error) {
    const isRateLimited =
      error.status === 429 ||
      error.message?.toLowerCase().includes('rate limit') ||
      error.message?.toLowerCase().includes('email rate');

    const isAlreadyRegistered =
      error.message?.toLowerCase().includes('already registered') ||
      error.message?.toLowerCase().includes('user already registered');

    if (isRateLimited) {
      console.warn('⚠️ Supabase email rate limit — inserting company without Auth user.');
      // Fall through: userId stays undefined but we still insert the company
    } else if (isAlreadyRegistered) {
      console.warn('⚠️ Auth email already exists — falling through to company insert.');
    } else {
      throw error;
    }
  }

  // ── Step 2: Insert company record (schema-aligned) ─────────────────────────
  // Columns that exist in the table:
  //   owner_name, email (UNIQUE), mobile, company_name, gst_number,
  //   business_role (enum), address, city, state, pin,
  //   is_verified, status (enum — do NOT set 'active', use schema default 'pending')
  const companyRecord: Record<string, any> = {
    owner_name: owner,
    email:         email,
    mobile:        mobile,
    company_name:  company,
    gst_number:    gst,
    business_role: role,          // must be a valid business_role_type enum value
    address:       address?.street ?? '',
    city:          address?.city  ?? '',
    state:         address?.state ?? '',
    pin:           address?.postalCode ?? '',
    is_verified:   false,
    // status: intentionally omitted — let the DB default ('pending') apply
  };

  const { data: insertData, error: insertError } = await supabase
    .from('companies')
    .insert([companyRecord])
    .select('id')
    .single();

  if (insertError) {
    // email unique violation → try update instead
    const isDuplicate =
      insertError.code === '23505' ||
      insertError.message?.toLowerCase().includes('duplicate') ||
      insertError.message?.toLowerCase().includes('unique');

    if (isDuplicate) {
      console.warn('⚠️ Company with this email already exists — updating record.');
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          owner_name:    owner,
          mobile:        mobile,
          company_name:  company,
          gst_number:    gst,
          business_role: role,
          address:       address?.street ?? '',
          city:          address?.city  ?? '',
          state:         address?.state ?? '',
          pin:           address?.postalCode ?? '',
        })
        .eq('email', email);

      if (updateError) {
        console.error('Company update failed:', updateError);
      }
    } else {
      console.error('Company insert failed:', insertError);
    }
  } else {
    console.log('✅ Company record created, id:', insertData?.id);
  }

  return { uid: data?.user?.id ?? `email_${email}` };
}