const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testProducts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Testing Supabase products...\n');

  // Count total products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total products in database: ${count || 0}`);

  // Get first 5 products with images
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_type,
      category,
      base_price,
      in_stock,
      total_inventory,
      product_images (
        image_url,
        image_type,
        position
      )
    `)
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('\nFirst 5 products:');
  products?.forEach(product => {
    console.log(`\n- ${product.name}`);
    console.log(`  Type: ${product.product_type}, Category: ${product.category}`);
    console.log(`  Price: $${(product.base_price / 100).toFixed(2)}`);
    console.log(`  In Stock: ${product.in_stock}, Inventory: ${product.total_inventory}`);
    console.log(`  Images: ${product.product_images?.length || 0}`);
    if (product.product_images?.length > 0) {
      console.log(`  Primary Image: ${product.product_images[0].image_url}`);
    }
  });

  // Check for products without images
  const { count: noImageCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('product_images', null);

  console.log(`\nProducts without images: ${noImageCount || 0}`);
}

testProducts().catch(console.error);