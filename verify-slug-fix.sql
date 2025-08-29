-- ============================================
-- VERIFY SLUG FIX
-- Run this after applying the fix to verify
-- ============================================

-- 1. Check if columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('slug', 'handle')
ORDER BY column_name;

-- 2. Count products with and without slugs
SELECT 
  'Total Products' as metric,
  COUNT(*) as count
FROM products
UNION ALL
SELECT 
  'Products with Slugs' as metric,
  COUNT(*) as count
FROM products 
WHERE slug IS NOT NULL AND slug != ''
UNION ALL
SELECT 
  'Products with Handles' as metric,
  COUNT(*) as count
FROM products 
WHERE handle IS NOT NULL AND handle != ''
UNION ALL
SELECT 
  'Products Missing Slugs' as metric,
  COUNT(*) as count
FROM products 
WHERE slug IS NULL OR slug = '';

-- 3. Check for duplicate slugs (should be unique)
SELECT 
  slug,
  COUNT(*) as duplicate_count
FROM products
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- 4. Sample of products with their slugs
SELECT 
  id,
  name,
  slug,
  handle,
  category,
  status
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- 5. Test query that was failing before
-- This should work now without "column slug does not exist" error
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.category,
  p.base_price,
  p.primary_image
FROM products p
WHERE p.status = 'active'
AND p.visibility = true
LIMIT 5;

-- 6. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
AND indexname IN ('idx_products_slug', 'idx_products_handle');

-- 7. Final status
DO $$
DECLARE
  total_count INTEGER;
  slug_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM products;
  SELECT COUNT(*) INTO slug_count FROM products WHERE slug IS NOT NULL AND slug != '';
  missing_count := total_count - slug_count;
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'SLUG FIX VERIFICATION RESULTS:';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Total Products: %', total_count;
  RAISE NOTICE 'Products with Slugs: %', slug_count;
  RAISE NOTICE 'Missing Slugs: %', missing_count;
  RAISE NOTICE '';
  
  IF missing_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All products have slugs!';
    RAISE NOTICE 'The error should be completely resolved.';
  ELSE
    RAISE NOTICE '⚠️ WARNING: % products still missing slugs', missing_count;
    RAISE NOTICE 'Run the URGENT-SLUG-FIX.sql again.';
  END IF;
END $$;