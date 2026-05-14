-- Comprehensive schema update for stock_items table
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

ALTER TABLE public.stock_items
  -- Pricing & Financials
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS mrp NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS single_shop_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS multi_shop_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS dealer_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS retailer_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS offer_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1,
  
  -- Product Metadata
  ADD COLUMN IF NOT EXISTS hsn_code TEXT,
  ADD COLUMN IF NOT EXISTS fabric_type TEXT,
  ADD COLUMN IF NOT EXISTS fabric_description TEXT,
  ADD COLUMN IF NOT EXISTS delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS item_code TEXT,
  ADD COLUMN IF NOT EXISTS batch_code TEXT,
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'PCS',
  ADD COLUMN IF NOT EXISTS unit_mode TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS bulk_selling_mode TEXT,
  
  -- Variant & Combination Data
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS variant_groups JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS combinations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb,
  
  -- Images & Assets
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS main_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS main_image_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vton_image_url TEXT,
  
  -- Logical & Status
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS has_offer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS offer_type TEXT,
  ADD COLUMN IF NOT EXISTS offer_time_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS offer_min_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS traders_only BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS selected_traders JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  
  -- Seller Identity
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS seller_company TEXT,
  ADD COLUMN IF NOT EXISTS supplier_type TEXT;

-- Ensure the columns have the correct types if they already existed but were wrong (optional, but safer)
-- ALTER TABLE public.stock_items ALTER COLUMN quantity TYPE INTEGER USING quantity::integer;
-- ALTER TABLE public.stock_items ALTER COLUMN has_offer TYPE BOOLEAN USING has_offer::boolean;

COMMENT ON TABLE public.stock_items IS 'Stores product stock information for the B2B platform';
