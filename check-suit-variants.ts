import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuitVariants() {
  console.log('🔍 Checking suit product variants...\n');

  // Get some suit products
  const { data: suits } = await supabase
    .from('products')
    .select('id, name, category')
    .or('category.ilike.%suit%,category.ilike.%tuxedo%')
    .limit(5);

  if (!suits || suits.length === 0) {
    console.log('No suit products found');
    return;
  }

  // Check variants for each suit
  for (const suit of suits) {
    console.log(`\n📦 ${suit.name}`);
    
    const { data: variants } = await supabase
      .from('product_variants')
      .select('title, option1, option2, option3, price, sku, stripe_price_id')
      .eq('product_id', suit.id);

    if (!variants || variants.length === 0) {
      console.log('   ❌ NO VARIANTS');
      continue;
    }

    console.log(`   Found ${variants.length} variant(s):`);
    variants.forEach(v => {
      const size = v.option1 || v.option2 || v.option3 || v.title || 'No size';
      console.log(`   - ${size}`);
      console.log(`     SKU: ${v.sku}`);
      console.log(`     Price: $${(v.price / 100).toFixed(2)}`);
      console.log(`     Stripe ID: ${v.stripe_price_id ? '✅' : '❌ MISSING'}`);
    });
  }

  // Check what's in option fields across all products
  console.log('\n\n📊 Checking all option values in variants:');
  
  const { data: allVariants } = await supabase
    .from('product_variants')
    .select('title, option1, option2, option3')
    .limit(100);

  const option1Values = new Set<string>();
  const option2Values = new Set<string>();
  const option3Values = new Set<string>();
  const titleValues = new Set<string>();

  allVariants?.forEach(v => {
    if (v.option1) option1Values.add(v.option1);
    if (v.option2) option2Values.add(v.option2);
    if (v.option3) option3Values.add(v.option3);
    if (v.title) titleValues.add(v.title);
  });

  console.log(`\nUnique option1 values (${option1Values.size}):`, Array.from(option1Values).slice(0, 10));
  console.log(`\nUnique option2 values (${option2Values.size}):`, Array.from(option2Values).slice(0, 10));
  console.log(`\nUnique option3 values (${option3Values.size}):`, Array.from(option3Values).slice(0, 10));
  console.log(`\nUnique title values (${titleValues.size}):`, Array.from(titleValues).slice(0, 10));

  // Check if we need to create suit size variants
  console.log('\n\n⚠️  ANALYSIS:');
  if (titleValues.has('Default Size') || option1Values.size === 0) {
    console.log('❌ Suits are using default/single variants instead of proper size variants!');
    console.log('   Need to create variants for sizes: 36S-54L (chest 36-54, lengths S/R/L)');
    console.log('\n   Typical suit sizes needed:');
    console.log('   36S, 36R, 36L, 38S, 38R, 38L, 40S, 40R, 40L,');
    console.log('   42S, 42R, 42L, 44S, 44R, 44L, 46S, 46R, 46L,');
    console.log('   48S, 48R, 48L, 50S, 50R, 50L, 52S, 52R, 52L, 54S, 54R, 54L');
  }

  process.exit(0);
}

checkSuitVariants().catch(console.error);