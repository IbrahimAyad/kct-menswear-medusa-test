import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuitSizes() {
  console.log('Checking suit products and their sizes...\n');

  // First, let's see what suit products we have
  const { data: suitProducts, error: productError } = await supabase
    .from('products')
    .select('id, name, category')
    .or('category.ilike.%suit%,category.ilike.%tuxedo%')
    .limit(10);

  if (productError) {
    console.error('Error fetching products:', productError);
    return;
  }

  console.log(`Found ${suitProducts?.length} suit/tuxedo products (showing first 10):\n`);

  // For each suit product, check what sizes are available
  for (const product of suitProducts || []) {
    console.log(`\n📦 ${product.name}`);
    console.log(`   Category: ${product.category}`);
    
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('size, price, stripe_price_id')
      .eq('product_id', product.id)
      .order('size');

    if (variantError) {
      console.log(`   ❌ Error fetching variants: ${variantError.message}`);
      continue;
    }

    if (!variants || variants.length === 0) {
      console.log(`   ⚠️  NO VARIANTS FOUND!`);
    } else {
      console.log(`   Sizes available: ${variants.map(v => v.size).join(', ')}`);
      console.log(`   Price: $${(variants[0].price / 100).toFixed(2)}`);
      console.log(`   Has Stripe ID: ${variants[0].stripe_price_id ? '✅' : '❌'}`);
    }
  }

  // Let's also check overall size distribution
  console.log('\n\n📊 Overall Size Distribution for Suits/Tuxedos:');
  
  const { data: sizeStats, error: statsError } = await supabase
    .from('product_variants')
    .select('size, product_id, products!inner(category)')
    .or('products.category.ilike.%suit%,products.category.ilike.%tuxedo%', { foreignTable: 'products' });

  if (!statsError && sizeStats) {
    const sizeCounts: Record<string, number> = {};
    sizeStats.forEach(variant => {
      sizeCounts[variant.size] = (sizeCounts[variant.size] || 0) + 1;
    });

    console.log('\nSize distribution:');
    Object.entries(sizeCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([size, count]) => {
        console.log(`   ${size}: ${count} products`);
      });
  }

  // Check if we're missing typical suit sizes
  console.log('\n\n🔍 Checking for typical suit sizes (36S-54L):');
  const typicalSuitSizes = [
    '36S', '36R', '36L',
    '38S', '38R', '38L',
    '40S', '40R', '40L',
    '42S', '42R', '42L',
    '44S', '44R', '44L',
    '46S', '46R', '46L',
    '48S', '48R', '48L',
    '50S', '50R', '50L',
    '52S', '52R', '52L',
    '54S', '54R', '54L'
  ];

  const { data: existingSizes } = await supabase
    .from('product_variants')
    .select('size')
    .in('size', typicalSuitSizes);

  const foundSizes = new Set(existingSizes?.map(v => v.size) || []);
  const missingSizes = typicalSuitSizes.filter(size => !foundSizes.has(size));

  if (missingSizes.length > 0) {
    console.log(`❌ Missing typical suit sizes: ${missingSizes.join(', ')}`);
  } else {
    console.log('✅ All typical suit sizes found!');
  }

  process.exit(0);
}

checkSuitSizes().catch(console.error);