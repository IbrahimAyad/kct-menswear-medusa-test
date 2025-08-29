// Script to create Stripe products and prices
// Run with: node scripts/setup-stripe-products.js

const Stripe = require('stripe');

// IMPORTANT: Replace with your actual Stripe secret key
const stripe = new Stripe('sk_live_YOUR_SECRET_KEY_HERE');

const suits = [
  { name: 'Navy Suit', colorKey: 'navy' },
  { name: 'Beige Suit', colorKey: 'beige' },
  { name: 'Black Suit', colorKey: 'black' },
  { name: 'Charcoal Grey Suit', colorKey: 'charcoalGrey' },
  { name: 'Light Grey Suit', colorKey: 'lightGrey' },
  { name: 'Tan Suit', colorKey: 'tan' },
  { name: 'Brown Suit', colorKey: 'brown' },
  { name: 'Dark Brown Suit', colorKey: 'darkBrown' },
  { name: 'Burgundy Suit', colorKey: 'burgundy' },
  { name: 'Sand Suit', colorKey: 'sand' },
  { name: 'Emerald Suit', colorKey: 'emerald' },
  { name: 'Midnight Blue Suit', colorKey: 'midnightBlue' },
  { name: 'Hunter Green Suit', colorKey: 'hunterGreen' },
  { name: 'Indigo Suit', colorKey: 'indigo' },
];

async function createSuitProducts() {
  const results = {};
  
  for (const suit of suits) {
    try {
      console.log(`Creating ${suit.name}...`);
      
      // Create product
      const product = await stripe.products.create({
        name: suit.name,
        description: `Premium ${suit.name.toLowerCase()} crafted from premium fabric. Features a modern slim-fit design with notch lapels, perfect for professional settings or formal occasions.`,
        metadata: {
          category: 'suits',
          color: suit.colorKey,
        },
      });
      
      // Create 2-piece price
      const price2p = await stripe.prices.create({
        product: product.id,
        unit_amount: 17999, // $179.99 in cents
        currency: 'usd',
        nickname: `${suit.name} - 2 Piece`,
        metadata: {
          type: 'twoPiece',
        },
      });
      
      // Create 3-piece price
      const price3p = await stripe.prices.create({
        product: product.id,
        unit_amount: 19999, // $199.99 in cents
        currency: 'usd',
        nickname: `${suit.name} - 3 Piece`,
        metadata: {
          type: 'threePiece',
        },
      });
      
      results[suit.colorKey] = {
        productId: product.id,
        twoPiece: price2p.id,
        threePiece: price3p.id,
      };
      
      console.log(`✅ Created ${suit.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   2-Piece Price: ${price2p.id}`);
      console.log(`   3-Piece Price: ${price3p.id}`);
      
    } catch (error) {
      console.error(`❌ Error creating ${suit.name}:`, error.message);
    }
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Output the results for updating the code
  console.log('\n\n=== COPY THIS TO UPDATE stripeProductService.ts ===\n');
  console.log('export const stripeProducts = {');
  console.log('  suits: {');
  Object.entries(results).forEach(([key, value]) => {
    console.log(`    ${key}: {`);
    console.log(`      productId: '${value.productId}',`);
    console.log(`      twoPiece: '${value.twoPiece}',`);
    console.log(`      threePiece: '${value.threePiece}',`);
    console.log(`    },`);
  });
  console.log('  },');
  console.log('};');
}

// Run if called directly
if (require.main === module) {
  createSuitProducts();
}