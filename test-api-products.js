#!/usr/bin/env node

// Test script to verify API product fetching
const http = require('http');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testAPI() {
  const baseUrl = 'http://localhost:3006/api/products/unified';
  
  console.log('🔍 Testing Product API Endpoints\n');
  console.log('================================\n');
  
  // Test 1: Fetch all products
  try {
    console.log('Test 1: Fetching all products...');
    const allData = await fetchJSON(baseUrl);
    console.log(`✅ Total products: ${allData.totalCount || 0}`);
    console.log(`   - Individual: ${allData.products?.filter(p => p.type === 'individual').length || 0}`);
    console.log(`   - Bundles: ${allData.products?.filter(p => p.type === 'bundle').length || 0}`);
    console.log(`   - Core: ${allData.products?.filter(p => p.tags?.includes('core')).length || 0}`);
  } catch (error) {
    console.error('❌ Error fetching all products:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Fetch suits
  try {
    console.log('Test 2: Fetching suits...');
    const suitsData = await fetchJSON(`${baseUrl}?category=Suits`);
    console.log(`✅ Suits found: ${suitsData.totalCount || 0}`);
    if (suitsData.products && suitsData.products.length > 0) {
      console.log('   Sample suit:', suitsData.products[0].name);
    }
  } catch (error) {
    console.error('❌ Error fetching suits:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Fetch prom collection
  try {
    console.log('Test 3: Fetching prom collection...');
    const promUrl = `${baseUrl}?category=Suits,Tuxedos,Blazers&tags=prom,formal`;
    const promData = await fetchJSON(promUrl);
    console.log(`✅ Prom products found: ${promData.totalCount || 0}`);
    if (promData.products && promData.products.length > 0) {
      console.log('   First 3 products:');
      promData.products.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name} ($${p.price})`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching prom products:', error.message);
  }
  
  console.log('\n');
  
  // Test 4: Check for Supabase products specifically
  try {
    console.log('Test 4: Checking for Supabase products...');
    const data = await fetchJSON(`${baseUrl}?includeIndividual=true`);
    
    // Check if any products have Supabase-specific fields or are individual products
    const supabaseProducts = data.products?.filter(p => 
      p.type === 'individual' ||
      p.inventory_quantity !== undefined || 
      p.product_type !== undefined ||
      p.meta_description !== undefined ||
      p.metaDescription !== undefined ||
      (p.id && p.id.includes('-') && p.id.length > 30) // UUID pattern
    ) || [];
    
    console.log(`✅ Supabase products found: ${supabaseProducts.length}`);
    
    // Check for core products (the 28 Stripe products)
    const coreProducts = data.products?.filter(p => 
      p.stripePriceId && p.tags?.includes('core')
    ) || [];
    
    console.log(`✅ Core products (Stripe): ${coreProducts.length}`);
    
    // Check for bundles
    const bundles = data.products?.filter(p => p.type === 'bundle' || p.isBundle) || [];
    console.log(`✅ Bundles: ${bundles.length}`);
    
    if (supabaseProducts.length === 0) {
      console.log('\n   ⚠️  No Supabase products detected. Possible issues:');
      console.log('   1. Database connection - Check NEXT_PUBLIC_SUPABASE_URL env var');
      console.log('   2. Database empty - Ensure products exist with:');
      console.log('      - visibility = true');
      console.log('      - status = active');
      console.log('   3. Category mismatch - Database categories may not match filters');
      console.log('   4. Schema issues - Check column names match API query');
    } else {
      console.log('\n   ✅ Supabase connection working!');
      console.log(`   Sample product: ${supabaseProducts[0]?.name || 'N/A'}`);
    }
  } catch (error) {
    console.error('❌ Error checking Supabase products:', error.message);
  }
  
  console.log('\n================================');
  console.log('✅ API Test Complete\n');
  console.log('Summary:');
  console.log('- If you see only Core + Bundles = Database not connected');
  console.log('- If you see Supabase products = Everything working!');
  console.log('- Check /api/products/unified route for errors\n');
}

// Run tests
console.log('Starting API tests...\n');
testAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});