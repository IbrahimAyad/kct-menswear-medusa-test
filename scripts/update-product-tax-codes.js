// Script to update Stripe products with tax codes
// Run with: node scripts/update-product-tax-codes.js

const Stripe = require('stripe');

// IMPORTANT: Replace with your actual Stripe secret key
const stripe = new Stripe('sk_live_YOUR_SECRET_KEY_HERE');

async function updateProductTaxCodes() {
  try {
    // List all products
    const products = await stripe.products.list({ limit: 100 });
    
    console.log(`Found ${products.data.length} products to update\n`);
    
    for (const product of products.data) {
      // Skip if product is not active
      if (!product.active) continue;
      
      // Tax code for clothing (general apparel)
      // See: https://stripe.com/docs/tax/tax-codes
      const taxCode = 'txcd_99999999'; // General - Tangible Goods
      // Alternative: 'txcd_20010000' for Clothing specifically
      
      try {
        const updated = await stripe.products.update(product.id, {
          tax_code: taxCode,
        });
        
        console.log(`✅ Updated ${product.name} with tax code`);
      } catch (error) {
        console.error(`❌ Failed to update ${product.name}:`, error.message);
      }
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Tax codes update complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  updateProductTaxCodes();
}