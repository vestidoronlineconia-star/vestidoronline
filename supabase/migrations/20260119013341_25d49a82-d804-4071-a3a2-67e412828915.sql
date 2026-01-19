-- Phase 1: Extend client_products table for stock management and better product info

-- Add description field for product details
ALTER TABLE public.client_products 
ADD COLUMN IF NOT EXISTS description text;

-- Add subcategory for better catalog organization  
ALTER TABLE public.client_products 
ADD COLUMN IF NOT EXISTS subcategory text;

-- Add stock_by_size as JSONB to store stock per size (e.g., {"S": 5, "M": 10, "L": 3})
ALTER TABLE public.client_products 
ADD COLUMN IF NOT EXISTS stock_by_size jsonb DEFAULT '{}'::jsonb;

-- Add total_stock as computed helper (optional, can derive from stock_by_size)
ALTER TABLE public.client_products 
ADD COLUMN IF NOT EXISTS total_stock integer DEFAULT 0;

-- Add index for faster category/subcategory filtering
CREATE INDEX IF NOT EXISTS idx_client_products_category ON public.client_products(client_id, category);
CREATE INDEX IF NOT EXISTS idx_client_products_subcategory ON public.client_products(client_id, subcategory);