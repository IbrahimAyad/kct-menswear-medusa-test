import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('Checking database structure...\n');

  // Check products table structure
  console.log('📦 PRODUCTS TABLE:');
  const { data: sampleProduct } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .single();

  if (sampleProduct) {
    console.log('Columns:', Object.keys(sampleProduct).join(', '));
    console.log('\nSample product:');
    console.log(JSON.stringify(sampleProduct, null, 2));
  }

  // Check product_variants table structure
  console.log('\n\n📊 PRODUCT_VARIANTS TABLE:');
  const { data: sampleVariant } = await supabase
    .from('product_variants')
    .select('*')
    .limit(1)
    .single();

  if (sampleVariant) {
    console.log('Columns:', Object.keys(sampleVariant).join(', '));
    console.log('\nSample variant:');
    console.log(JSON.stringify(sampleVariant, null, 2));
  } else {
    console.log('❌ No data found in product_variants table');
    
    // Check if table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%variant%');
    
    console.log('\nTables with "variant" in name:', tables);
  }

  // Check how many products have variants
  console.log('\n\n📈 STATISTICS:');
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  const { count: variantCount } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true });

  console.log(`Total products: ${productCount}`);
  console.log(`Total variants: ${variantCount}`);

  // Check suit products specifically
  console.log('\n\n👔 SUIT PRODUCTS:');
  const { data: suits, count: suitCount } = await supabase
    .from('products')
    .select('id, name, category, base_price', { count: 'exact' })
    .or('category.ilike.%suit%,category.ilike.%tuxedo%')
    .limit(5);

  console.log(`Found ${suitCount} suit/tuxedo products`);
  console.log('\nFirst 5 suits:');
  suits?.forEach(suit => {
    console.log(`- ${suit.name} (${suit.category}) - Base: $${(suit.base_price / 100).toFixed(2)}`);
  });

  process.exit(0);
}

checkDatabaseStructure().catch(console.error);