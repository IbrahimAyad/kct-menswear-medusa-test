#!/usr/bin/env node

// Diagnostic script to check actual product categories
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

async function diagnoseCategories() {
  console.log('🔍 Diagnosing Product Categories\n');
  console.log('================================\n');
  
  try {
    // Fetch all products
    const data = await fetchJSON('http://localhost:3006/api/products/unified?includeIndividual=true');
    
    console.log(`Total products fetched: ${data.totalCount || 0}\n`);
    
    if (data.products && data.products.length > 0) {
      // Analyze product types
      const productTypes = new Map();
      const categories = new Map();
      const tags = new Set();
      
      data.products.forEach(product => {
        // Track product types
        const type = product.type || 'unknown';
        productTypes.set(type, (productTypes.get(type) || 0) + 1);
        
        // Track categories
        const category = product.category || 'no-category';
        categories.set(category, (categories.get(category) || 0) + 1);
        
        // Track product_type field (Supabase specific)
        if (product.product_type) {
          const pt = product.product_type;
          categories.set(`[DB] ${pt}`, (categories.get(`[DB] ${pt}`) || 0) + 1);
        }
        
        // Collect tags
        if (product.tags && Array.isArray(product.tags)) {
          product.tags.forEach(tag => tags.add(tag));
        }
      });
      
      // Display results
      console.log('📊 Product Types:');
      productTypes.forEach((count, type) => {
        console.log(`   ${type}: ${count}`);
      });
      
      console.log('\n📁 Categories Found:');
      const sortedCategories = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
      sortedCategories.forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
      
      console.log('\n🏷️  Unique Tags (first 20):');
      const tagArray = Array.from(tags).slice(0, 20);
      tagArray.forEach(tag => {
        console.log(`   - ${tag}`);
      });
      
      // Check for specific issues
      console.log('\n⚠️  Diagnostics:');
      
      // Check if products have the fields we expect
      const sampleProduct = data.products[0];
      console.log('\nSample Product Structure:');
      console.log('   id:', sampleProduct.id ? '✅' : '❌');
      console.log('   name:', sampleProduct.name ? '✅' : '❌');
      console.log('   title:', sampleProduct.title ? '✅' : '❌');
      console.log('   price:', sampleProduct.price ? '✅' : '❌');
      console.log('   category:', sampleProduct.category ? '✅' : '❌');
      console.log('   product_type:', sampleProduct.product_type ? '✅' : '❌');
      console.log('   tags:', sampleProduct.tags ? '✅' : '❌');
      console.log('   stripePriceId:', sampleProduct.stripePriceId ? '✅' : '❌');
      console.log('   type:', sampleProduct.type ? '✅' : '❌');
      console.log('   isBundle:', sampleProduct.isBundle ? '✅' : '❌');
      
      // Show a few product names and categories
      console.log('\n📦 First 5 Products:');
      data.products.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name || p.title || 'No name'}`);
        console.log(`     Category: ${p.category || 'none'} | Type: ${p.product_type || 'none'}`);
        console.log(`     Price: $${p.price} | Tags: ${(p.tags || []).slice(0, 3).join(', ')}`);
      });
      
      // Check why Suits category returns 0
      const suitsCount = data.products.filter(p => 
        p.category === 'Suits' || 
        p.product_type === 'Suits' ||
        (p.name && p.name.toLowerCase().includes('suit'))
      ).length;
      
      console.log(`\n🔍 Products matching "Suits": ${suitsCount}`);
      
      if (suitsCount === 0) {
        console.log('   ❌ No products have category="Suits"');
        console.log('   Suggestion: Update database product_type values or use different filter');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n================================');
  console.log('✅ Diagnostic Complete\n');
}

// Run diagnostic
diagnoseCategories().catch(console.error);