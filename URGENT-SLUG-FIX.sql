-- ============================================
-- URGENT FIX: SLUG COLUMN ERROR
-- Run this immediately in Supabase SQL Editor
-- ============================================

-- Step 1: Add slug column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Step 2: Add handle column (some code uses this)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS handle VARCHAR(255);

-- Step 3: Generate slugs from product names
UPDATE products 
SET slug = CASE 
  WHEN slug IS NULL OR slug = '' THEN
    LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REPLACE(REPLACE(name, ' & ', '-and-'), '''', ''),  -- Replace & and apostrophes
                '[^a-zA-Z0-9\s\-]+', '', 'g'  -- Remove special characters
              ),
              '\s+', '-', 'g'  -- Replace spaces with dashes
            ),
            '-+', '-', 'g'  -- Replace multiple dashes with single
          ),
          '^-|-$', '', 'g'  -- Remove leading/trailing dashes
        )
      )
    )
  ELSE slug
END;

-- Step 4: Copy slug to handle for backward compatibility
UPDATE products 
SET handle = slug 
WHERE handle IS NULL OR handle = '';

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);

-- Step 6: Handle any NULL cases with ID-based slugs
UPDATE products 
SET slug = CONCAT('product-', id::text) 
WHERE slug IS NULL OR slug = '';

UPDATE products 
SET handle = slug 
WHERE handle IS NULL OR handle = '';

-- Step 7: Verify the fix
SELECT 
  COUNT(*) as total_products,
  COUNT(slug) as products_with_slug,
  COUNT(handle) as products_with_handle,
  COUNT(*) - COUNT(slug) as missing_slugs
FROM products;

-- Step 8: Show sample products with slugs
SELECT 
  id,
  name,
  slug,
  handle,
  category,
  base_price
FROM products 
WHERE slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ SLUG FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'All products now have slug and handle columns.';
  RAISE NOTICE 'The error should be resolved.';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still see errors, check that:';
  RAISE NOTICE '1. This script executed without errors';
  RAISE NOTICE '2. You refreshed your application';
  RAISE NOTICE '3. Clear any caches (browser/server)';
END $$;