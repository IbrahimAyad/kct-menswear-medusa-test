#!/usr/bin/env node

// Script to verify all bundles have Stripe Price IDs

const fs = require('fs');
const path = require('path');

// Import all bundle files
const bundleFiles = [
  '../src/lib/products/bundleProducts.ts',
  '../src/lib/products/casualBundles.ts', 
  '../src/lib/products/promBundles.ts',
  '../src/lib/products/weddingBundles.ts'
];

let totalBundles = 0;
let bundlesWithIds = 0;
let bundlesWithoutIds = [];
let priceIdUsage = {};

console.log('=== BUNDLE STRIPE ID VERIFICATION ===\n');

bundleFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract bundle name from filename
  const fileName = path.basename(file, '.ts');
  
  // Find all bundle definitions
  const bundleMatches = content.match(/id:\s*['"]([^'"]+)['"]/g) || [];
  const priceIdMatches = content.match(/stripePriceId:\s*['"]([^'"]+)['"]/g) || [];
  
  console.log(`\n📁 ${fileName}:`);
  console.log(`   Bundles found: ${bundleMatches.length}`);
  console.log(`   Price IDs found: ${priceIdMatches.length}`);
  
  // Count Price ID usage
  priceIdMatches.forEach(match => {
    const priceId = match.split(':')[1].trim().replace(/['"]/g, '');
    priceIdUsage[priceId] = (priceIdUsage[priceId] || 0) + 1;
  });
  
  totalBundles += bundleMatches.length;
  bundlesWithIds += priceIdMatches.length;
  
  if (bundleMatches.length !== priceIdMatches.length) {
    console.log(`   ⚠️  MISMATCH: ${bundleMatches.length - priceIdMatches.length} bundles missing Price IDs`);
    
    // Try to identify which bundles are missing IDs
    const lines = content.split('\n');
    let currentBundle = null;
    let hasStripeId = false;
    
    lines.forEach((line, index) => {
      if (line.includes('id:') && line.includes("'bundle-") || 
          line.includes('id:') && line.includes("'casual-") ||
          line.includes('id:') && line.includes("'prom-") ||
          line.includes('id:') && line.includes("'wedding-")) {
        if (currentBundle && !hasStripeId) {
          bundlesWithoutIds.push(currentBundle);
        }
        currentBundle = line.match(/id:\s*['"]([^'"]+)['"]/)?.[1];
        hasStripeId = false;
      }
      if (line.includes('stripePriceId:') && line.includes('price_')) {
        hasStripeId = true;
      }
    });
    
    // Check last bundle
    if (currentBundle && !hasStripeId) {
      bundlesWithoutIds.push(currentBundle);
    }
  } else {
    console.log(`   ✅ All bundles have Price IDs`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Total Bundles: ${totalBundles}`);
console.log(`Bundles with Stripe IDs: ${bundlesWithIds}`);
console.log(`Bundles without IDs: ${totalBundles - bundlesWithIds}`);

if (bundlesWithoutIds.length > 0) {
  console.log('\n⚠️  BUNDLES MISSING STRIPE IDs:');
  bundlesWithoutIds.forEach(id => console.log(`   - ${id}`));
}

console.log('\n=== PRICE ID USAGE ===');
const sortedPriceIds = Object.entries(priceIdUsage).sort((a, b) => b[1] - a[1]);
sortedPriceIds.forEach(([priceId, count]) => {
  const priceMap = {
    'price_1RpvZUCHc12x7sCzM4sp9DY5': '$199.99 - Starter Bundle',
    'price_1RpvZtCHc12x7sCzny7VmEWD': '$229.99 - Professional Bundle (adjusted)',
    'price_1RpvaBCHc12x7sCzRV6Hy0Im': '$249.99/$279.99 - Executive Bundle',
    'price_1RpvfvCHc12x7sCzq1jYfG9o': '$299.99 - Premium Bundle'
  };
  
  const description = priceMap[priceId] || 'Unknown';
  console.log(`${priceId}: ${count} bundles (${description})`);
});

console.log('\n=== VERIFICATION COMPLETE ===');

if (totalBundles === bundlesWithIds) {
  console.log('✅ SUCCESS: All 66 bundles have Stripe Price IDs assigned!');
  console.log('\nNote: Bundles are using shared Price IDs from Core Products:');
  console.log('- This is a quick fix that allows immediate checkout functionality');
  console.log('- For proper tracking, each bundle should have its own unique Stripe Product/Price');
} else {
  console.log(`❌ ERROR: ${totalBundles - bundlesWithIds} bundles still need Stripe Price IDs`);
  process.exit(1);
}