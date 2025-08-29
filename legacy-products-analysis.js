const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeLegacyProducts() {
  console.log('🔍 Analyzing Legacy Products and Schema...\n');

  try {
    // 1. Check legacy products table structure
    console.log('📊 Legacy Products Table Analysis...');
    const { data: legacyProducts, error: legacyError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (legacyError) {
      console.error('❌ Error fetching legacy products:', legacyError.message);
      return;
    }

    if (legacyProducts && legacyProducts.length > 0) {
      console.log('✅ Legacy products accessible');
      console.log('   Sample product structure:');
      const sample = legacyProducts[0];
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} ${sample[key] === null ? '(null)' : ''}`);
      });
      console.log('');
    }

    // 2. Get full count and check for required fields
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total Legacy Products: ${totalProducts}`);

    // 3. Check product_images table
    console.log('\n🖼️  Product Images Table Analysis...');
    const { count: totalImages } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total Product Images: ${totalImages}`);

    if (totalImages === 0) {
      console.log('⚠️  No images found in product_images table');
      
      // Check if products have image data in other fields
      const { data: productsWithImages, error: imgError } = await supabase
        .from('products')
        .select('id, name, handle, additional_info')
        .limit(10);
      
      if (!imgError && productsWithImages) {
        let imageFieldsFound = 0;
        productsWithImages.forEach(product => {
          if (product.additional_info && typeof product.additional_info === 'object') {
            const hasImageData = Object.keys(product.additional_info).some(key => 
              key.toLowerCase().includes('image') || 
              key.toLowerCase().includes('photo') ||
              key.toLowerCase().includes('url')
            );
            if (hasImageData) imageFieldsFound++;
          }
        });
        console.log(`   Products with potential image data in additional_info: ${imageFieldsFound}/10`);
      }
    }

    // 4. Check product_variants table
    console.log('\n📦 Product Variants Analysis...');
    const { count: totalVariants } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total Product Variants: ${totalVariants}`);

    const { data: sampleVariants, error: varError } = await supabase
      .from('product_variants')
      .select('*')
      .limit(3);
    
    if (!varError && sampleVariants && sampleVariants.length > 0) {
      console.log('   Sample variant structure:');
      const sampleVar = sampleVariants[0];
      Object.keys(sampleVar).forEach(key => {
        console.log(`   ${key}: ${typeof sampleVar[key]} ${sampleVar[key] === null ? '(null)' : ''}`);
      });
    }

    // 5. Check schema inconsistencies
    console.log('\n🔧 Schema Consistency Check...');
    
    // Test for expected fields in products table
    const expectedFields = ['stripe_price_id', 'images', 'image_url'];
    for (const field of expectedFields) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(field)
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ Field '${field}' does not exist in products table`);
          } else {
            console.log(`⚠️  Error checking field '${field}': ${error.message}`);
          }
        } else {
          console.log(`✅ Field '${field}' exists in products table`);
        }
      } catch (err) {
        console.log(`❌ Exception checking field '${field}': ${err.message}`);
      }
    }

    // 6. Check for relationship integrity
    console.log('\n🔗 Relationship Integrity Check...');
    
    // Check if product_variants reference existing products
    const { data: orphanedVariants, error: orphanError } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .limit(100);
    
    if (!orphanError && orphanedVariants) {
      const productIds = [...new Set(orphanedVariants.map(v => v.product_id))];
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);
      
      const existingProductIds = new Set(existingProducts?.map(p => p.id) || []);
      const orphanedCount = orphanedVariants.filter(v => !existingProductIds.has(v.product_id)).length;
      
      console.log(`   Orphaned variants (no parent product): ${orphanedCount}`);
      console.log(`   Valid variant relationships: ${orphanedVariants.length - orphanedCount}`);
    }

    // 7. Check for products with enhanced counterparts
    console.log('\n🔀 Legacy vs Enhanced Products...');
    const { data: allLegacyProducts } = await supabase
      .from('products')
      .select('id, name, handle');
    
    const { data: allEnhancedProducts } = await supabase
      .from('products_enhanced')
      .select('id, name, slug');
    
    if (allLegacyProducts && allEnhancedProducts) {
      // Check for potential duplicates based on name similarity
      let potentialDuplicates = 0;
      const legacyNames = new Set(allLegacyProducts.map(p => p.name?.toLowerCase()));
      
      allEnhancedProducts.forEach(enhanced => {
        if (legacyNames.has(enhanced.name?.toLowerCase())) {
          potentialDuplicates++;
        }
      });
      
      console.log(`   Legacy products: ${allLegacyProducts.length}`);
      console.log(`   Enhanced products: ${allEnhancedProducts.length}`);
      console.log(`   Potential name duplicates: ${potentialDuplicates}`);
    }

    console.log('\n✅ Legacy Products Analysis Complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeLegacyProducts();