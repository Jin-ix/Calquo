-- Check if superadmin exists, if not, create one in auth.users
DO $do BEGIN
  IF NOT EXISTS (SELECT FROM auth.users WHERE email = 'superadmin@tex-app.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'superadmin@tex-app.com',
      crypt('super-admin-verified', gen_salt('bf')),
      current_timestamp,
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "Super Administrator", "gst_number": "SUPERADMIN123", "role": "super-admin", "company": "CALIQUO Super Administration"}',
      current_timestamp,
      current_timestamp,
      '',
      '',
      '',
      ''
    );
  END IF;
END $do;

-- Now make sure they are in the companies table
INSERT INTO public.companies (
  id,
  user_id,
  company_name,
  owner_name,
  email,
  mobile,
  gst_number,
  business_role,
  verified,
  status
)
SELECT 
  gen_random_uuid(),
  id,
  'CALIQUO Super Administration',
  'Super Administrator',
  'superadmin@tex-app.com',
  '+91 98765 43201',
  'SUPERADMIN123',
  'super-admin',
  true,
  'active'
FROM auth.users
WHERE email = 'superadmin@tex-app.com'
AND NOT EXISTS (SELECT 1 FROM public.companies WHERE email = 'superadmin@tex-app.com');
