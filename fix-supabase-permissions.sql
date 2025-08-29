-- Fix Supabase Permissions for Products
-- Run this in your Supabase SQL Editor

-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_variants;

-- Create new policies for read access
CREATE POLICY "Enable read access for all users" 
ON products FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON product_images FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON product_variants FOR SELECT 
USING (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants');

-- Test query (should return product count)
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as image_count FROM product_images;
SELECT COUNT(*) as variant_count FROM product_variants;