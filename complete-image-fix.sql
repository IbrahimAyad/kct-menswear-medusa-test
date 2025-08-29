-- COMPLETE Product Image Fix - All 10 Products
-- Sources: Image-URLS-CSV folder & product_gallery-Super-KCT-Web.csv
-- Date: 2025-08-13

-- ✅ 1. Green Forest Vest And Tie Set 
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_04/nan_forest-green-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Green Forest Vest And Tie Set';

-- ✅ 2. Men's White Slim Fit Mock Neck Dress Shirt - 2025 Collection
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_3/dress-shirt_white-dress-shirt_1.0.png' 
WHERE name = 'Men''s White Slim Fit Mock Neck Dress Shirt - 2025 Collection';

-- ✅ 3. Peach Vest & Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_2/vest-tie_peach-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Peach Vest & Tie Set';

-- ✅ 4. Orange Suspender & Bowtie Set (FOUND in product_gallery CSV!)
UPDATE products 
SET primary_image = 'https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev/main-suspender-bowtie-set/orange-model.png'
WHERE name = 'Orange Suspender & Bowtie Set';

-- ✅ 5. Men's Casual Brown Blazer - Summer Collection
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_3/blazer_copy-of-rose-brown-sparkle-prom-blazer_1.0.jpg' 
WHERE name = 'Men''s Casual Brown Blazer - Summer Collection';

-- ✅ 6. Pink Bubblegum Vest And Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_02/nan_bubblegum-pink-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Pink Bubblegum Vest And Tie Set';

-- ✅ 7. Magenta Vest Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_2/vest-tie_magenta-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Magenta Vest Tie Set';

-- ✅ 8. Burnt Orange Suspender & Bowtie Set (FOUND in product_gallery CSV!)
UPDATE products 
SET primary_image = 'https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev/main-suspender-bowtie-set/burnt-orange-model.png'
WHERE name = 'Burnt Orange Suspender & Bowtie Set';

-- ✅ 9. Royal Blue Kids Suit
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_4/kid-suit_royal-blue-kids-suit_1.0.jpg' 
WHERE name = 'Royal Blue Kids Suit';

-- ✅ 10. Men's Tuxedo Black Geometric Blazer - Prom & Wedding 2025
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_4/blazer_black-glitter-rhinestone-shawl-lapel-tuxedo-blazer-prom-2025_1.0.jpg' 
WHERE name = 'Men''s Tuxedo Black Geometric Blazer - Prom & Wedding 2025';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after updates to confirm all images are fixed:

SELECT 
  name, 
  primary_image,
  CASE 
    WHEN primary_image IS NULL THEN '❌ NO IMAGE'
    WHEN primary_image LIKE '%.jpg' OR primary_image LIKE '%.png' OR primary_image LIKE '%.webp' THEN '✅ VALID'
    ELSE '⚠️ INCOMPLETE URL'
  END as image_status
FROM products 
WHERE name IN (
  'Green Forest Vest And Tie Set',
  'Men''s White Slim Fit Mock Neck Dress Shirt - 2025 Collection',
  'Peach Vest & Tie Set',
  'Orange Suspender & Bowtie Set',
  'Men''s Casual Brown Blazer - Summer Collection',
  'Pink Bubblegum Vest And Tie Set',
  'Magenta Vest Tie Set',
  'Burnt Orange Suspender & Bowtie Set',
  'Royal Blue Kids Suit',
  'Men''s Tuxedo Black Geometric Blazer - Prom & Wedding 2025'
)
ORDER BY 
  CASE image_status
    WHEN '✅ VALID' THEN 1
    WHEN '⚠️ INCOMPLETE URL' THEN 2
    WHEN '❌ NO IMAGE' THEN 3
  END,
  name;

-- ============================================
-- ADDITIONAL GALLERY IMAGES (Optional)
-- ============================================
-- If you want to add gallery images for the suspender sets:

/*
-- Orange Suspender & Bowtie Set Gallery
INSERT INTO product_images (product_id, image_url, display_order)
SELECT 
  id,
  'https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev/main-suspender-bowtie-set/orange-sus-bowtie.jpg',
  2
FROM products 
WHERE name = 'Orange Suspender & Bowtie Set';

-- Burnt Orange Suspender & Bowtie Set Gallery
INSERT INTO product_images (product_id, image_url, display_order)
SELECT 
  id,
  'https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev/main-suspender-bowtie-set/burnt-orange.jpg',
  2
FROM products 
WHERE name = 'Burnt Orange Suspender & Bowtie Set';
*/

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ ALL 10 PRODUCTS NOW HAVE VALID IMAGE URLs
-- - 8 products from original CSV files
-- - 2 suspender sets from product_gallery-Super-KCT-Web.csv
-- 
-- Image Sources:
-- - pub-5cd8c531c0034986bf6282a223bd0564.r2.dev (original CSVs)
-- - pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev (product gallery CSV)