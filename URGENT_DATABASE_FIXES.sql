-- ============================================================================
-- URGENT DATABASE FIXES FOR KCT MENSWEAR
-- Execute these fixes immediately to resolve critical issues
-- ============================================================================

-- Fix 1: CRITICAL - Migrate Enhanced Product Images to product_images Table
-- This resolves the collections page image display issue

-- First, let's check the current state
SELECT 'Current product_images count' as check_type, COUNT(*) as count FROM product_images
UNION ALL
SELECT 'Enhanced products with images', COUNT(*) FROM products_enhanced WHERE images != '{}';

-- Create a backup of the current product_images table (empty but safe)
CREATE TABLE IF NOT EXISTS product_images_backup AS SELECT * FROM product_images;

-- Migrate hero images from enhanced products
INSERT INTO product_images (
    product_id, 
    image_url, 
    alt_text, 
    position, 
    image_type,
    width,
    height,
    created_at,
    updated_at
)
SELECT 
    pe.id as product_id,
    pe.images->'hero'->>'url' as image_url,
    COALESCE(pe.images->'hero'->>'alt_text', pe.name || ' - Main Image') as alt_text,
    1 as position,
    'hero' as image_type,
    COALESCE((pe.images->'hero'->>'width')::integer, 1200) as width,
    COALESCE((pe.images->'hero'->>'height')::integer, 1600) as height,
    NOW() as created_at,
    NOW() as updated_at
FROM products_enhanced pe
WHERE pe.images->'hero'->>'url' IS NOT NULL
  AND pe.images->'hero'->>'url' != '';

-- Migrate gallery images from enhanced products
INSERT INTO product_images (
    product_id, 
    image_url, 
    alt_text, 
    position, 
    image_type,
    width,
    height,
    created_at,
    updated_at
)
SELECT 
    pe.id as product_id,
    gallery_item->>'url' as image_url,
    COALESCE(gallery_item->>'alt_text', pe.name || ' - Gallery Image ' || (row_number() OVER (PARTITION BY pe.id ORDER BY gallery_index))) as alt_text,
    (row_number() OVER (PARTITION BY pe.id ORDER BY gallery_index)) + 1 as position,
    'gallery' as image_type,
    COALESCE((gallery_item->>'width')::integer, 1200) as width,
    COALESCE((gallery_item->>'height')::integer, 1600) as height,
    NOW() as created_at,
    NOW() as updated_at
FROM products_enhanced pe,
     jsonb_array_elements(pe.images->'gallery') WITH ORDINALITY AS gallery_items(gallery_item, gallery_index)
WHERE pe.images->'gallery' IS NOT NULL
  AND jsonb_array_length(pe.images->'gallery') > 0
  AND gallery_item->>'url' IS NOT NULL
  AND gallery_item->>'url' != '';

-- Fix 2: HIGH PRIORITY - Fix Pricing Tiers Structure
-- Convert empty objects to proper pricing tier arrays

UPDATE products_enhanced 
SET pricing_tiers = jsonb_build_array(
    jsonb_build_object(
        'tier_id', CASE 
            WHEN base_price <= 150 THEN 1
            WHEN base_price <= 200 THEN 2
            WHEN base_price <= 250 THEN 3
            WHEN base_price <= 300 THEN 4
            WHEN base_price <= 350 THEN 5
            WHEN base_price <= 400 THEN 6
            WHEN base_price <= 450 THEN 7
            WHEN base_price <= 500 THEN 8
            WHEN base_price <= 550 THEN 9
            WHEN base_price <= 600 THEN 10
            WHEN base_price <= 650 THEN 11
            WHEN base_price <= 700 THEN 12
            WHEN base_price <= 750 THEN 13
            WHEN base_price <= 800 THEN 14
            WHEN base_price <= 900 THEN 15
            WHEN base_price <= 1000 THEN 16
            WHEN base_price <= 1200 THEN 17
            WHEN base_price <= 1500 THEN 18
            WHEN base_price <= 2000 THEN 19
            ELSE 20
        END,
        'tier_name', CASE 
            WHEN base_price <= 150 THEN 'Essential'
            WHEN base_price <= 200 THEN 'Value'
            WHEN base_price <= 250 THEN 'Budget Plus'
            WHEN base_price <= 300 THEN 'Smart Buy'
            WHEN base_price <= 350 THEN 'Quality Entry'
            WHEN base_price <= 400 THEN 'Professional'
            WHEN base_price <= 450 THEN 'Business'
            WHEN base_price <= 500 THEN 'Executive Ready'
            WHEN base_price <= 550 THEN 'Corporate Plus'
            WHEN base_price <= 600 THEN 'Senior Professional'
            WHEN base_price <= 650 THEN 'Premium'
            WHEN base_price <= 700 THEN 'Premium Plus'
            WHEN base_price <= 750 THEN 'Elite'
            WHEN base_price <= 800 THEN 'Elite Plus'
            WHEN base_price <= 900 THEN 'Prestige'
            WHEN base_price <= 1000 THEN 'Luxury'
            WHEN base_price <= 1200 THEN 'Luxury Plus'
            WHEN base_price <= 1500 THEN 'Designer'
            WHEN base_price <= 2000 THEN 'Couture'
            ELSE 'Bespoke'
        END,
        'tier_segment', CASE 
            WHEN base_price <= 300 THEN 'value'
            WHEN base_price <= 600 THEN 'professional'
            WHEN base_price <= 900 THEN 'premium'
            ELSE 'luxury'
        END,
        'price_range', jsonb_build_object(
            'min', CASE 
                WHEN base_price <= 150 THEN 0
                WHEN base_price <= 200 THEN 151
                WHEN base_price <= 250 THEN 201
                WHEN base_price <= 300 THEN 251
                WHEN base_price <= 350 THEN 301
                WHEN base_price <= 400 THEN 351
                WHEN base_price <= 450 THEN 401
                WHEN base_price <= 500 THEN 451
                WHEN base_price <= 550 THEN 501
                WHEN base_price <= 600 THEN 551
                WHEN base_price <= 650 THEN 601
                WHEN base_price <= 700 THEN 651
                WHEN base_price <= 750 THEN 701
                WHEN base_price <= 800 THEN 751
                WHEN base_price <= 900 THEN 801
                WHEN base_price <= 1000 THEN 901
                WHEN base_price <= 1200 THEN 1001
                WHEN base_price <= 1500 THEN 1201
                WHEN base_price <= 2000 THEN 1501
                ELSE 2001
            END,
            'max', CASE 
                WHEN base_price <= 150 THEN 150
                WHEN base_price <= 200 THEN 200
                WHEN base_price <= 250 THEN 250
                WHEN base_price <= 300 THEN 300
                WHEN base_price <= 350 THEN 350
                WHEN base_price <= 400 THEN 400
                WHEN base_price <= 450 THEN 450
                WHEN base_price <= 500 THEN 500
                WHEN base_price <= 550 THEN 550
                WHEN base_price <= 600 THEN 600
                WHEN base_price <= 650 THEN 650
                WHEN base_price <= 700 THEN 700
                WHEN base_price <= 750 THEN 750
                WHEN base_price <= 800 THEN 800
                WHEN base_price <= 900 THEN 900
                WHEN base_price <= 1000 THEN 1000
                WHEN base_price <= 1200 THEN 1200
                WHEN base_price <= 1500 THEN 1500
                WHEN base_price <= 2000 THEN 2000
                ELSE 999999
            END
        ),
        'description', CASE 
            WHEN base_price <= 300 THEN 'Affordable quality for students and budget-conscious customers'
            WHEN base_price <= 600 THEN 'Professional attire for business and work environments'
            WHEN base_price <= 900 THEN 'Premium materials and superior craftsmanship'
            ELSE 'Luxury and bespoke options for discerning customers'
        END
    )
)
WHERE pricing_tiers = '{}'::jsonb 
   OR pricing_tiers IS NULL 
   OR NOT jsonb_typeof(pricing_tiers) = 'array';

-- Fix 3: Add missing indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_position ON product_images(product_id, position);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_type ON product_images(image_type);

-- Fix 4: Update enhanced products inventory structure if needed
UPDATE products_enhanced 
SET inventory = jsonb_build_object(
    'total_stock', COALESCE((inventory->>'total_stock')::integer, 100),
    'reserved_stock', COALESCE((inventory->>'reserved_stock')::integer, 0),
    'available_stock', COALESCE((inventory->>'available_stock')::integer, 100),
    'low_stock_threshold', COALESCE((inventory->>'low_stock_threshold')::integer, 5),
    'allow_backorder', COALESCE((inventory->>'allow_backorder')::boolean, false),
    'track_inventory', true,
    'last_updated', NOW()::text
)
WHERE inventory = '{}'::jsonb 
   OR inventory IS NULL;

-- Fix 5: Ensure proper SEO structure
UPDATE products_enhanced 
SET seo = jsonb_build_object(
    'title', COALESCE(seo->>'title', name),
    'description', COALESCE(seo->>'description', LEFT(description, 160)),
    'keywords', COALESCE(seo->'keywords', jsonb_build_array(category, 'menswear', 'suits', 'KCT')),
    'canonical_url', '/products/' || slug,
    'og_title', COALESCE(seo->>'og_title', name),
    'og_description', COALESCE(seo->>'og_description', LEFT(description, 160)),
    'og_image', COALESCE(seo->>'og_image', images->'hero'->>'url')
)
WHERE seo = '{}'::jsonb 
   OR seo IS NULL;

-- Fix 6: Create a view for unified product access (helps with frontend compatibility)
CREATE OR REPLACE VIEW unified_products AS
SELECT 
    id,
    name,
    slug as handle,
    category,
    subcategory,
    base_price as price,
    description,
    images,
    pricing_tiers,
    inventory,
    status,
    featured,
    trending,
    stripe_product_id,
    stripe_price_id,
    created_at,
    updated_at,
    'enhanced' as source_type,
    -- Calculate if in stock
    CASE 
        WHEN (inventory->>'available_stock')::integer > 0 THEN true
        WHEN (inventory->>'allow_backorder')::boolean = true THEN true
        ELSE false
    END as in_stock,
    -- Get primary image URL
    images->'hero'->>'url' as primary_image_url,
    -- Calculate pricing tier info
    (pricing_tiers->0->>'tier_name') as tier_name,
    (pricing_tiers->0->>'tier_segment') as tier_segment
FROM products_enhanced
WHERE status = 'active';

-- Grant access to the view
GRANT SELECT ON unified_products TO anon, authenticated;

-- Verification queries to check the fixes
SELECT 'Fix Verification' as status, 'Checking image migration...' as description;

SELECT 
    'Images migrated' as check_type,
    COUNT(*) as count
FROM product_images;

SELECT 
    'Products with pricing tiers' as check_type,
    COUNT(*) as count
FROM products_enhanced 
WHERE jsonb_typeof(pricing_tiers) = 'array' 
  AND jsonb_array_length(pricing_tiers) > 0;

SELECT 
    'Products with inventory data' as check_type,
    COUNT(*) as count
FROM products_enhanced 
WHERE inventory != '{}'::jsonb 
  AND inventory->>'total_stock' IS NOT NULL;

-- Check the unified view
SELECT 
    'Unified view accessible' as check_type,
    COUNT(*) as count
FROM unified_products;

-- Success message
SELECT 'DATABASE FIXES COMPLETED' as status, 
       'All critical issues should now be resolved' as message,
       NOW() as completed_at;

COMMIT;