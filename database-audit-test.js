const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function comprehensiveDatabaseAudit() {
  console.log('🔍 Starting Comprehensive Database Audit...\n');

  try {
    // 1. Test Basic Connection
    console.log('📡 Testing Connection...');
    const { data: connTest, error: connError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (connError) {
      console.error('❌ Connection Error:', connError.message);
      console.error('   Code:', connError.code);
      console.error('   Details:', connError.details);
      return;
    }
    console.log('✅ Connection successful\n');

    // 2. Check Table Existence and Row Counts
    console.log('📊 Checking Table Structure and Data...');
    
    const tables = [
      'products',
      'product_variants', 
      'product_images',
      'products_enhanced',
      'product_variants_enhanced',
      'collections',
      'orders',
      'customers'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`❌ Table '${table}' does not exist`);
          } else {
            console.log(`❌ ${table}: Error - ${error.message}`);
          }
        } else {
          console.log(`✅ ${table}: ${count || 0} rows`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`);
      }
    }
    console.log('');

    // 3. Check RLS Policies
    console.log('🔒 Testing RLS Policies...');
    
    // Test products access
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, status, visibility')
      .limit(5);
    
    if (prodError) {
      console.log('❌ Products RLS blocking access:', prodError.message);
    } else {
      console.log(`✅ Products accessible: ${products?.length || 0} rows returned`);
    }

    // Test enhanced products access
    const { data: enhancedProducts, error: enhancedError } = await supabase
      .from('products_enhanced')
      .select('id, name, status')
      .limit(5);
    
    if (enhancedError) {
      console.log('❌ Enhanced Products RLS issue:', enhancedError.message);
    } else {
      console.log(`✅ Enhanced Products accessible: ${enhancedProducts?.length || 0} rows returned`);
    }
    console.log('');

    // 4. Check Image URLs
    console.log('🖼️  Analyzing Image URLs...');
    const { data: images, error: imgError } = await supabase
      .from('product_images')
      .select('id, image_url, product_id')
      .limit(10);
    
    if (imgError) {
      console.log('❌ Images access error:', imgError.message);
    } else if (images && images.length > 0) {
      const urlPatterns = {
        r2_bucket1: 0,
        r2_bucket2: 0,
        cdn_new: 0,
        other: 0
      };

      images.forEach(img => {
        if (img.image_url.includes('pub-46371bda6faf4910b74631159fc2dfd4')) {
          urlPatterns.r2_bucket1++;
        } else if (img.image_url.includes('pub-8ea0502158a94b8ca8a7abb9e18a57e8')) {
          urlPatterns.r2_bucket2++;
        } else if (img.image_url.includes('cdn.kctmenswear.com')) {
          urlPatterns.cdn_new++;
        } else {
          urlPatterns.other++;
        }
      });

      console.log('   URL Distribution:');
      console.log(`   📦 R2 Bucket 1: ${urlPatterns.r2_bucket1}`);
      console.log(`   📦 R2 Bucket 2: ${urlPatterns.r2_bucket2}`);
      console.log(`   🌐 New CDN: ${urlPatterns.cdn_new}`);
      console.log(`   ❓ Other: ${urlPatterns.other}`);
    } else {
      console.log('   ⚠️  No images found');
    }
    console.log('');

    // 5. Check Enhanced Products Structure
    console.log('🔧 Checking Enhanced Products Schema...');
    if (enhancedProducts && enhancedProducts.length > 0) {
      const sampleProduct = await supabase
        .from('products_enhanced')
        .select('*')
        .limit(1)
        .single();
      
      if (sampleProduct.data) {
        const product = sampleProduct.data;
        console.log('   Sample Enhanced Product Structure:');
        console.log(`   - ID: ${product.id}`);
        console.log(`   - Name: ${product.name}`);
        console.log(`   - Category: ${product.category}`);
        console.log(`   - Base Price: ${product.base_price}`);
        console.log(`   - Images Type: ${typeof product.images}`);
        console.log(`   - Pricing Tiers: ${Array.isArray(product.pricing_tiers) ? product.pricing_tiers.length : 'Not Array'}`);
        console.log(`   - Stripe Product ID: ${product.stripe_product_id || 'Not Set'}`);
      }
    }
    console.log('');

    // 6. Check Stripe Integration
    console.log('💳 Checking Stripe Integration...');
    const { data: stripeProducts, error: stripeError } = await supabase
      .from('products')
      .select('id, name, stripe_price_id')
      .not('stripe_price_id', 'is', null)
      .limit(5);
    
    if (stripeError) {
      console.log('❌ Stripe products check failed:', stripeError.message);
    } else {
      console.log(`✅ Products with Stripe Price IDs: ${stripeProducts?.length || 0}`);
    }

    const { data: enhancedStripe, error: enhancedStripeError } = await supabase
      .from('products_enhanced')
      .select('id, name, stripe_product_id, stripe_price_id')
      .not('stripe_product_id', 'is', null)
      .limit(5);
    
    if (enhancedStripeError) {
      console.log('❌ Enhanced Stripe check failed:', enhancedStripeError.message);
    } else {
      console.log(`✅ Enhanced Products with Stripe IDs: ${enhancedStripe?.length || 0}`);
    }
    console.log('');

    // 7. Performance Check
    console.log('⚡ Performance Testing...');
    const startTime = Date.now();
    const { data: perfTest, error: perfError } = await supabase
      .from('products')
      .select('id, name, base_price')
      .limit(50);
    const endTime = Date.now();
    
    if (perfError) {
      console.log('❌ Performance test failed:', perfError.message);
    } else {
      console.log(`✅ Query performance: ${endTime - startTime}ms for ${perfTest?.length} products`);
    }

    // 8. Check Environment Configuration
    console.log('\n🔧 Environment Configuration:');
    console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Anon Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Service Role Key: ${serviceKey ? '✅ Set' : '❌ Missing'}`);

    console.log('\n✅ Database Audit Complete!');

  } catch (error) {
    console.error('❌ Audit failed with unexpected error:', error);
  }
}

comprehensiveDatabaseAudit();