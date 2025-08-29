-- DATABASE VERIFICATION QUERIES
-- Run these queries in your Supabase SQL Editor to verify your data

-- 1. Check total number of products
SELECT COUNT(*) as total_products FROM products;

-- 2. Check if products table has data with basic info
SELECT 
    id,
    title,
    handle,
    status,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check product variants count and sample data
SELECT COUNT(*) as total_variants FROM product_variants;

SELECT 
    pv.id,
    pv.title,
    pv.price,
    pv.available,
    p.title as product_title
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
LIMIT 10;

-- 4. Check product images count and sample data
SELECT COUNT(*) as total_images FROM product_images;

SELECT 
    pi.id,
    pi.src,
    pi.alt_text,
    p.title as product_title
FROM product_images pi
JOIN products p ON pi.product_id = p.id
LIMIT 10;

-- 5. Check collections count and data
SELECT COUNT(*) as total_collections FROM collections;

SELECT 
    id,
    title,
    handle,
    created_at
FROM collections 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Comprehensive data summary
SELECT 
    'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 
    'product_variants' as table_name, COUNT(*) as record_count FROM product_variants
UNION ALL
SELECT 
    'product_images' as table_name, COUNT(*) as record_count FROM product_images
UNION ALL
SELECT 
    'collections' as table_name, COUNT(*) as record_count FROM collections;

-- 7. Check RLS policies are working (this should return data if policies are correct)
SELECT 
    p.id,
    p.title,
    p.status,
    COUNT(pv.id) as variant_count,
    COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.title, p.status
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. Check for any products with specific collections
SELECT 
    p.title as product_title,
    c.title as collection_title
FROM products p
JOIN product_collections pc ON p.id = pc.product_id
JOIN collections c ON pc.collection_id = c.id
LIMIT 10;