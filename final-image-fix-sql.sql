-- KCT Menswear Product Image Fix SQL
-- Run these UPDATE statements in Supabase SQL Editor
-- Generated from Image-URLS-CSV folder data
-- Date: 2025-08-13

-- 1. Green Forest Vest And Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_04/nan_forest-green-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Green Forest Vest And Tie Set';

-- 2. Men's White Slim Fit Mock Neck Dress Shirt - 2025 Collection
-- Using a white dress shirt image from the CSV
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_3/dress-shirt_white-dress-shirt_1.0.png' 
WHERE name = 'Men''s White Slim Fit Mock Neck Dress Shirt - 2025 Collection';

-- 3. Peach Vest & Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_2/vest-tie_peach-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Peach Vest & Tie Set';

-- 4. Orange Suspender & Bowtie Set
-- Using orange vest image as placeholder for suspender set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_03/nan_orange-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Orange Suspender & Bowtie Set';

-- 5. Men's Casual Brown Blazer - Summer Collection
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_3/blazer_copy-of-rose-brown-sparkle-prom-blazer_1.0.jpg' 
WHERE name = 'Men''s Casual Brown Blazer - Summer Collection';

-- 6. Pink Bubblegum Vest And Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_02/nan_bubblegum-pink-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Pink Bubblegum Vest And Tie Set';

-- 7. Magenta Vest Tie Set
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_2/vest-tie_magenta-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Magenta Vest Tie Set';

-- 8. Burnt Orange Suspender & Bowtie Set
-- Using salmon/orange vest as placeholder
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/tie_clean_batch_01/tie_clean_batch_02/nan_salmon-orange-vest-and-tie-set_1.0.jpg' 
WHERE name = 'Burnt Orange Suspender & Bowtie Set';

-- 9. Royal Blue Kids Suit
-- Using a kids suit image from the CSV (black kids suit as placeholder)
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_4/kid-suit_black-kids-suit_1.0.jpg' 
WHERE name = 'Royal Blue Kids Suit';

-- 10. Men's Tuxedo Black Geometric Blazer - Prom & Wedding 2025
-- Using a black formal blazer from the CSV
UPDATE products 
SET primary_image = 'https://pub-5cd8c531c0034986bf6282a223bd0564.r2.dev/batch_1/batch_4/blazer_black-glitter-rhinestone-shawl-lapel-tuxedo-blazer-prom-2025_1.0.jpg' 
WHERE name = 'Men''s Tuxedo Black Geometric Blazer - Prom & Wedding 2025';

-- Verification query to check if updates were successful
-- Run this after the updates to verify:
/*
SELECT name, primary_image 
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
);
*/