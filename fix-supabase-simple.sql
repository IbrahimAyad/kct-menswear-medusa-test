-- Simple Supabase RLS Fix
-- Run each section one at a time in your Supabase SQL Editor

-- STEP 1: Check current RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants');

-- STEP 2: Drop existing policies manually
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Allow anonymous read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to products" ON products;
DROP POLICY IF EXISTS "public_read_products" ON products;

DROP POLICY IF EXISTS "Enable read access for all users" ON product_images;
DROP POLICY IF EXISTS "Allow anonymous read access to product_images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated read access to product_images" ON product_images;
DROP POLICY IF EXISTS "public_read_images" ON product_images;

DROP POLICY IF EXISTS "Enable read access for all users" ON product_variants;
DROP POLICY IF EXISTS "Allow anonymous read access to product_variants" ON product_variants;
DROP POLICY IF EXISTS "Allow authenticated read access to product_variants" ON product_variants;
DROP POLICY IF EXISTS "public_read_variants" ON product_variants;

-- STEP 3: QUICK TEST - Disable RLS temporarily
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- STEP 4: Test query (should work now)
SELECT COUNT(*) as count FROM products;

-- STEP 5: If the count works, re-enable RLS with proper policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create simple public access policies
CREATE POLICY "anyone_can_read_products" ON products
FOR SELECT TO public USING (true);

CREATE POLICY "anyone_can_read_images" ON product_images
FOR SELECT TO public USING (true);

CREATE POLICY "anyone_can_read_variants" ON product_variants
FOR SELECT TO public USING (true);

-- STEP 7: Verify the new policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants');

-- STEP 8: Final test
SELECT 
  p.id,
  p.name,
  COUNT(pi.id) as images,
  COUNT(pv.id) as variants
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name
LIMIT 5;