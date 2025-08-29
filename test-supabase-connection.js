const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Testing Supabase connection...
// URL: supabaseUrl ? '✅ Found' : '❌ Missing'
// Key: supabaseKey ? '✅ Found' : '❌ Missing'

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    // 📡 Testing connection...
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return;
    }
    // ✅ Connected to Supabase!

    // Test 2: Fetch products
    // 📦 Fetching products...
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }

    // ✅ Found ${products?.length || 0} products
    
    // if (products && products.length > 0) {
    //   First product:
    //   JSON.stringify(products[0], null, 2)
    // }

    // Test 3: Check product_images table
    // 🖼️  Checking images...
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);

    if (imagesError) {
      console.error('❌ Error fetching images:', imagesError.message);
    } else {
      // ✅ Found ${images?.length || 0} images
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();