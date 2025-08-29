-- ============================================
-- FIX SLUG COLUMN ERROR
-- Quick fix for "column slug does not exist" error
-- ============================================

-- 1. Add slug column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Generate slugs from existing product names
UPDATE products 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REPLACE(name, ' & ', '-and-'),  -- Replace & with -and-
        '[^a-zA-Z0-9\-]+', '-', 'g'     -- Replace non-alphanumeric with dash
      ),
      '-+', '-', 'g'                    -- Replace multiple dashes with single
    ),
    '^-|-$', '', 'g'                    -- Remove leading/trailing dashes
  )
)
WHERE slug IS NULL;

-- 3. Add handle column (alias for slug) if needed
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS handle VARCHAR(255);

-- 4. Copy slug to handle for compatibility
UPDATE products 
SET handle = slug 
WHERE handle IS NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);

-- 6. Make slug unique for future inserts (optional - comment out if you have duplicates)
-- ALTER TABLE products ADD CONSTRAINT unique_product_slug UNIQUE (slug);

-- 7. Add slug to product_variants if needed
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 8. Generate variant slugs
UPDATE product_variants pv
SET slug = LOWER(
  REGEXP_REPLACE(
    CONCAT(
      (SELECT slug FROM products WHERE id = pv.product_id),
      '-',
      COALESCE(pv.sku, pv.id::text)
    ),
    '[^a-zA-Z0-9\-]+', '-', 'g'
  )
)
WHERE pv.slug IS NULL;

-- 9. Quick verification
DO $$
DECLARE
  product_count INTEGER;
  products_with_slugs INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO products_with_slugs FROM products WHERE slug IS NOT NULL;
  
  RAISE NOTICE 'Total products: %', product_count;
  RAISE NOTICE 'Products with slugs: %', products_with_slugs;
  
  IF product_count = products_with_slugs THEN
    RAISE NOTICE '✅ All products now have slugs!';
  ELSE
    RAISE NOTICE '⚠️ Some products still missing slugs. Run UPDATE again.';
  END IF;
END $$;

-- 10. Sample query to test
-- This should now work without errors:
SELECT 
  id,
  name,
  slug,
  handle,
  category,
  base_price
FROM products 
WHERE slug IS NOT NULL
LIMIT 5;