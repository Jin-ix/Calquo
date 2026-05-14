-- Run this in your Supabase SQL Editor to add ALL the missing columns
-- This matches exactly what the Add Stock UI is trying to send.

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS mrp NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS single_shop_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS multi_shop_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS fabric_description TEXT,
  ADD COLUMN IF NOT EXISTS item_code TEXT,
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT,
  ADD COLUMN IF NOT EXISTS batch_code TEXT,
  ADD COLUMN IF NOT EXISTS variants JSONB,
  ADD COLUMN IF NOT EXISTS images JSONB,
  ADD COLUMN IF NOT EXISTS vton_image_url TEXT,
  ADD COLUMN IF NOT EXISTS main_image_index INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS traders_only BOOLEAN,
  ADD COLUMN IF NOT EXISTS selected_traders JSONB,
  ADD COLUMN IF NOT EXISTS has_offer BOOLEAN,
  ADD COLUMN IF NOT EXISTS offer_time_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS offer_min_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS unit_mode TEXT,
  ADD COLUMN IF NOT EXISTS bulk_selling_mode TEXT,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS seller_company TEXT,
  ADD COLUMN IF NOT EXISTS variant_groups JSONB;
