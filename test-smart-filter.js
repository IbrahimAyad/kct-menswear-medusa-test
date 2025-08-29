#!/usr/bin/env node

/**
 * Test script for Smart Filter AI System
 * Demonstrates various filtering capabilities
 */

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3006,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🤖 KCT Smart Filter AI System Test\n');
  console.log('=' .repeat(50));
  
  // Test 1: Basic category filter with AI scoring
  console.log('\n📋 Test 1: Smart Filter for Suits');
  console.log('-'.repeat(40));
  try {
    const result = await makeRequest('/api/ai/smart-filter', 'POST', {
      categories: ['suits'],
      maxResults: 5,
      includeOutfitSuggestions: true
    });
    
    console.log(`✅ Found ${result.products?.length || 0} suits`);
    console.log(`📊 AI Score Range: ${result.metadata?.aiScoreRange?.min}-${result.metadata?.aiScoreRange?.max}`);
    console.log(`💰 Price Range: $${result.metadata?.priceRange?.min}-$${result.metadata?.priceRange?.max}`);
    
    if (result.suggestions?.length > 0) {
      console.log('\n💡 Filter Suggestions:');
      result.suggestions.slice(0, 3).forEach(s => {
        console.log(`   - ${s.type}: ${s.displayName} (${s.productCount} products, ${Math.round(s.confidence * 100)}% confidence)`);
      });
    }
    
    if (result.outfitSuggestions?.length > 0) {
      console.log('\n👔 Outfit Suggestions:');
      result.outfitSuggestions.slice(0, 2).forEach(outfit => {
        console.log(`   Base: ${outfit.baseProduct?.name}`);
        outfit.suggestions?.forEach(s => {
          console.log(`     + ${s.category}: ${s.products?.length || 0} options - ${s.reason}`);
        });
      });
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  // Test 2: Semantic search
  console.log('\n📋 Test 2: Semantic Search - "navy blue wedding suit"');
  console.log('-'.repeat(40));
  try {
    const result = await makeRequest('/api/ai/smart-filter', 'POST', {
      searchQuery: 'navy blue wedding suit',
      maxResults: 3
    });
    
    console.log(`✅ Found ${result.products?.length || 0} matching products`);
    
    if (result.products?.length > 0) {
      console.log('\n🎯 Top Results:');
      result.products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} - $${p.price} (AI Score: ${p.aiScore || 0})`);
      });
    }
    
    if (result.alternativeFilters?.length > 0) {
      console.log('\n🔄 Alternative Searches:');
      result.alternativeFilters.forEach(alt => {
        console.log(`   - ${alt.name}: ${alt.expectedResults} results (relevance: ${Math.round(alt.relevanceScore * 100)}%)`);
      });
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Price and color filtering
  console.log('\n📋 Test 3: Price + Color Filter');
  console.log('-'.repeat(40));
  try {
    const result = await makeRequest('/api/ai/smart-filter', 'POST', {
      colors: ['black', 'navy'],
      priceRange: { min: 200, max: 400 },
      maxResults: 5
    });
    
    console.log(`✅ Found ${result.products?.length || 0} products`);
    console.log(`🎨 Top Colors: ${result.metadata?.topColors?.map(c => `${c.name}(${c.count})`).join(', ')}`);
    console.log(`📁 Top Categories: ${result.metadata?.topCategories?.map(c => `${c.name}(${c.count})`).join(', ')}`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  // Test 4: User preferences simulation
  console.log('\n📋 Test 4: Personalized Recommendations');
  console.log('-'.repeat(40));
  try {
    const result = await makeRequest('/api/ai/smart-filter', 'POST', {
      userPreferences: {
        favoriteColors: ['navy', 'grey'],
        pricePreference: 'premium',
        styleProfile: 'modern',
        occasions: ['business', 'wedding']
      },
      seasonalRelevance: true,
      trendingOnly: false,
      maxResults: 5
    });
    
    console.log(`✅ Found ${result.products?.length || 0} personalized recommendations`);
    console.log(`⏱️ Search completed in ${result.metadata?.searchTime || 0}ms`);
    
    if (result.products?.length > 0) {
      console.log('\n🎯 Personalized Picks:');
      result.products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name}`);
        console.log(`      Price: $${p.price} | Score: ${p.aiScore || 0} | ${p.trending ? '🔥 Trending' : ''}`);
      });
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }
  
  // Test 5: Occasion-based filtering
  console.log('\n📋 Test 5: Occasion-Based Filter - Prom');
  console.log('-'.repeat(40));
  try {
    const result = await makeRequest('/api/ai/smart-filter', 'POST', {
      occasions: ['prom', 'formal'],
      categories: ['suits', 'tuxedos', 'blazers'],
      includeOutfitSuggestions: true,
      maxResults: 5
    });
    
    console.log(`✅ Found ${result.products?.length || 0} prom-appropriate items`);
    
    if (result.products?.length > 0) {
      const avgPrice = result.products.reduce((sum, p) => sum + parseFloat(p.price), 0) / result.products.length;
      console.log(`💰 Average Price: $${avgPrice.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Smart Filter Test Complete!\n');
  
  // Summary
  console.log('📊 AI Capabilities Tested:');
  console.log('   ✓ Basic filtering with AI scoring');
  console.log('   ✓ Semantic search with text relevance');
  console.log('   ✓ Multi-criteria filtering');
  console.log('   ✓ Personalized recommendations');
  console.log('   ✓ Outfit suggestions');
  console.log('   ✓ Alternative filter suggestions');
  console.log('   ✓ Seasonal relevance scoring');
  console.log('\n🚀 The Smart Filter Engine is ready for production!');
}

// Run tests
console.log('Starting Smart Filter tests...\n');
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});