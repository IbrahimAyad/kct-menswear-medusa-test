/**
 * Script to set up Stripe integration for existing Supabase products
 * Run this script to add Stripe price IDs to existing products in the database
 */

import { createClient } from '@supabase/supabase-js';
import { stripeProducts } from '@/lib/services/stripeProductService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProductMatch {
  productId: string;
  name: string;
  category: string;
  color?: string;
  piece_count?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
}

/**
 * Map colors to stripe product keys
 */
const colorMapping: Record<string, string> = {
  'navy': 'navy',
  'navy blue': 'navy',
  'beige': 'beige',
  'black': 'black',
  'charcoal grey': 'charcoalGrey',
  'charcoal gray': 'charcoalGrey',
  'light grey': 'lightGrey',
  'light gray': 'lightGrey',
  'tan': 'tan',
  'brown': 'brown',
  'dark brown': 'darkBrown',
  'burgundy': 'burgundy',
  'sand': 'sand',
  'emerald': 'emerald',
  'emerald green': 'emerald',
  'midnight blue': 'midnightBlue',
  'hunter green': 'hunterGreen',
  'indigo': 'indigo',
};

async function setupStripeIntegration() {
  console.log('🚀 Starting Stripe integration setup for Supabase products...');

  try {
    // 1. Fetch all products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    console.log(`📦 Found ${products?.length || 0} active products`);

    const updates: ProductMatch[] = [];

    // 2. Match products to Stripe price IDs
    for (const product of products || []) {
      const match: ProductMatch = {
        productId: product.id,
        name: product.name,
        category: product.category,
      };

      // Only process suits for now (other categories need Stripe products created)
      if (product.category?.toLowerCase().includes('suit')) {
        // Extract color from name or metadata
        const productName = product.name.toLowerCase();
        const metadata = product.metadata || {};
        
        let color = metadata.color?.toLowerCase();
        if (!color) {
          // Try to extract color from product name
          for (const [colorName, stripeKey] of Object.entries(colorMapping)) {
            if (productName.includes(colorName)) {
              color = colorName;
              break;
            }
          }
        }

        if (color) {
          const stripeKey = colorMapping[color];
          const stripeProduct = stripeProducts.suits[stripeKey as keyof typeof stripeProducts.suits];
          
          if (stripeProduct) {
            // Determine if this is a 2-piece or 3-piece suit
            const isThreePiece = productName.includes('3') || 
                               productName.includes('three') ||
                               metadata.piece_count === '3' ||
                               productName.includes('vest');

            match.color = color;
            match.piece_count = isThreePiece ? '3' : '2';
            match.stripe_product_id = stripeProduct.productId;
            match.stripe_price_id = isThreePiece ? stripeProduct.threePiece : stripeProduct.twoPiece;

            updates.push(match);
          }
        }
      }
    }

    console.log(`🔗 Found ${updates.length} products to update with Stripe data`);

    // 3. Update products with Stripe metadata
    for (const update of updates) {
      const updatedMetadata = {
        color: update.color,
        piece_count: update.piece_count,
        stripe_product_id: update.stripe_product_id,
        stripe_price_id: update.stripe_price_id,
      };

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.productId);

      if (updateError) {
        console.error(`❌ Failed to update product ${update.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${update.name} with Stripe price ID: ${update.stripe_price_id}`);
      }
    }

    // 4. Report results
    console.log('\n📊 Setup Summary:');
    console.log(`Total products processed: ${products?.length || 0}`);
    console.log(`Products updated with Stripe data: ${updates.length}`);
    console.log(`Products without Stripe mapping: ${(products?.length || 0) - updates.length}`);

    if (updates.length < (products?.length || 0)) {
      console.log('\n⚠️  Some products could not be mapped to Stripe:');
      console.log('- Non-suit products need Stripe products created first');
      console.log('- Products with unrecognized colors need manual mapping');
      console.log('- Consider creating additional Stripe products for full coverage');
    }

    console.log('\n🎉 Stripe integration setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupStripeIntegration();
}

export { setupStripeIntegration };