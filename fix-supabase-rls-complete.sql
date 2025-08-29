-- Complete Supabase RLS Fix
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

-- Create permissive policies for anonymous access
CREATE POLICY "Allow anonymous read access to products" 
ON products FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Allow anonymous read access to product_images" 
ON product_images FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Allow anonymous read access to product_variants" 
ON product_variants FOR SELECT 
TO anon
USING (true);

-- Also create policies for authenticated users (if needed)
CREATE POLICY "Allow authenticated read access to products" 
ON products FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to product_images" 
ON product_images FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to product_variants" 
ON product_variants FOR SELECT 
TO authenticated
USING (true);

-- Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants')
ORDER BY tablename, policyname;

-- Test with a simple query
SELECT COUNT(*) as total_products FROM products;

-- Test with a join query (like your code uses)
SELECT 
  p.id,
  p.name,
  COUNT(DISTINCT pi.id) as image_count,
  COUNT(DISTINCT pv.id) as variant_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name
LIMIT 5;