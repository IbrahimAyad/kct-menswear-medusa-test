-- Corrected Supabase RLS Fix
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants');

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on products
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON products', r.policyname);
  END LOOP;
  
  -- Drop all policies on product_images
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_images' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON product_images', r.policyname);
  END LOOP;
  
  -- Drop all policies on product_variants
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_variants' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON product_variants', r.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create simple public read policies
CREATE POLICY "public_read_products" ON products
FOR SELECT USING (true);

CREATE POLICY "public_read_images" ON product_images
FOR SELECT USING (true);

CREATE POLICY "public_read_variants" ON product_variants
FOR SELECT USING (true);

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants')
ORDER BY tablename, policyname;

-- Test with a simple query
SELECT COUNT(*) as total_products FROM products;