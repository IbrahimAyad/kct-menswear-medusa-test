const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeEnhancedProducts() {
  console.log('🔍 Analyzing Enhanced Products Data...\n');

  try {
    // 1. Get all enhanced products
    const { data: allProducts, error: allError } = await supabase
      .from('products_enhanced')
      .select('*');
    
    if (allError) {
      console.error('❌ Error fetching enhanced products:', allError.message);
      return;
    }

    console.log(`📊 Total Enhanced Products: ${allProducts.length}`);
    
    // 2. Analyze image structures
    let imageAnalysis = {
      emptyImages: 0,
      nullImages: 0,
      validImages: 0,
      malformedImages: 0,
      imageTypes: {},
      sampleImages: []
    };

    // 3. Analyze pricing tiers
    let pricingAnalysis = {
      noPricingTiers: 0,
      emptyArrayTiers: 0,
      validTiers: 0,
      nullTiers: 0,
      sampleTiers: []
    };

    // 4. Category distribution
    let categoryDistribution = {};

    // 5. Status distribution
    let statusDistribution = {};

    allProducts.forEach((product, index) => {
      // Image analysis
      if (product.images === null) {
        imageAnalysis.nullImages++;
      } else if (typeof product.images === 'object') {
        const imageStr = JSON.stringify(product.images);
        if (imageStr === '{}') {
          imageAnalysis.emptyImages++;
        } else {
          imageAnalysis.validImages++;
          if (index < 3) { // Store first 3 for samples
            imageAnalysis.sampleImages.push({
              productId: product.id,
              productName: product.name,
              images: product.images
            });
          }
        }
        
        // Track image structure types
        const keys = Object.keys(product.images || {});
        const keySignature = keys.sort().join(',');
        imageAnalysis.imageTypes[keySignature] = (imageAnalysis.imageTypes[keySignature] || 0) + 1;
      } else {
        imageAnalysis.malformedImages++;
      }

      // Pricing tier analysis
      if (product.pricing_tiers === null) {
        pricingAnalysis.nullTiers++;
      } else if (Array.isArray(product.pricing_tiers)) {
        if (product.pricing_tiers.length === 0) {
          pricingAnalysis.emptyArrayTiers++;
        } else {
          pricingAnalysis.validTiers++;
          if (pricingAnalysis.sampleTiers.length < 3) {
            pricingAnalysis.sampleTiers.push({
              productId: product.id,
              productName: product.name,
              tiers: product.pricing_tiers
            });
          }
        }
      } else {
        pricingAnalysis.noPricingTiers++;
      }

      // Category distribution
      categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;

      // Status distribution
      statusDistribution[product.status] = (statusDistribution[product.status] || 0) + 1;
    });

    // Display analysis results
    console.log('\n🖼️  Image Analysis:');
    console.log(`   Null images: ${imageAnalysis.nullImages}`);
    console.log(`   Empty images ({}): ${imageAnalysis.emptyImages}`);
    console.log(`   Valid images: ${imageAnalysis.validImages}`);
    console.log(`   Malformed images: ${imageAnalysis.malformedImages}`);
    
    console.log('\n   Image Structure Types:');
    Object.entries(imageAnalysis.imageTypes).forEach(([keys, count]) => {
      console.log(`   "${keys}": ${count} products`);
    });

    if (imageAnalysis.sampleImages.length > 0) {
      console.log('\n   Sample Image Structures:');
      imageAnalysis.sampleImages.forEach(sample => {
        console.log(`   Product: ${sample.productName}`);
        console.log(`   Structure: ${JSON.stringify(sample.images, null, 4)}`);
        console.log('   ---');
      });
    }

    console.log('\n💰 Pricing Tier Analysis:');
    console.log(`   Null pricing tiers: ${pricingAnalysis.nullTiers}`);
    console.log(`   Empty array tiers: ${pricingAnalysis.emptyArrayTiers}`);
    console.log(`   Valid pricing tiers: ${pricingAnalysis.validTiers}`);
    console.log(`   Non-array tiers: ${pricingAnalysis.noPricingTiers}`);

    if (pricingAnalysis.sampleTiers.length > 0) {
      console.log('\n   Sample Pricing Tiers:');
      pricingAnalysis.sampleTiers.forEach(sample => {
        console.log(`   Product: ${sample.productName}`);
        console.log(`   Tiers: ${JSON.stringify(sample.tiers, null, 4)}`);
        console.log('   ---');
      });
    }

    console.log('\n📂 Category Distribution:');
    Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });

    console.log('\n📋 Status Distribution:');
    Object.entries(statusDistribution).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 6. Check for missing required fields
    console.log('\n⚠️  Data Quality Issues:');
    let issueCount = 0;
    
    allProducts.forEach(product => {
      const issues = [];
      
      if (!product.name || product.name.trim() === '') {
        issues.push('Empty name');
      }
      if (!product.slug || product.slug.trim() === '') {
        issues.push('Empty slug');
      }
      if (!product.category || product.category.trim() === '') {
        issues.push('Empty category');
      }
      if (!product.base_price || product.base_price <= 0) {
        issues.push('Invalid price');
      }
      if (!product.description || product.description.trim() === '') {
        issues.push('Empty description');
      }

      if (issues.length > 0) {
        issueCount++;
        if (issueCount <= 5) { // Show first 5 issues
          console.log(`   Product ${product.id} (${product.name}): ${issues.join(', ')}`);
        }
      }
    });
    
    if (issueCount > 5) {
      console.log(`   ... and ${issueCount - 5} more products with issues`);
    } else if (issueCount === 0) {
      console.log('   ✅ No major data quality issues found');
    }

    // 7. Check for Stripe integration
    console.log('\n💳 Stripe Integration Status:');
    const productsWithStripe = allProducts.filter(p => p.stripe_product_id && p.stripe_price_id);
    const productsWithPartialStripe = allProducts.filter(p => 
      (p.stripe_product_id && !p.stripe_price_id) || 
      (!p.stripe_product_id && p.stripe_price_id)
    );
    
    console.log(`   Complete Stripe integration: ${productsWithStripe.length}`);
    console.log(`   Partial Stripe integration: ${productsWithPartialStripe.length}`);
    console.log(`   No Stripe integration: ${allProducts.length - productsWithStripe.length - productsWithPartialStripe.length}`);

    console.log('\n✅ Enhanced Products Analysis Complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeEnhancedProducts();