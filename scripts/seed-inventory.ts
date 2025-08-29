import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample inventory data for common suit sizes
const SUIT_SIZES = ['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R'];
const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['7', '8', '9', '10', '11', '12', '13'];

async function seedInventory() {
  try {
    console.log('Starting inventory seed...');

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('No products found. Seeding with sample data...');
      
      // Create sample inventory for known product IDs
      const sampleInventory = [
        // Suits
        ...SUIT_SIZES.map(size => ({
          product_id: '1',
          size,
          stock_quantity: Math.floor(Math.random() * 20) + 5,
          reserved_quantity: 0,
          low_stock_threshold: 5
        })),
        ...SUIT_SIZES.map(size => ({
          product_id: '2',
          size,
          stock_quantity: Math.floor(Math.random() * 15) + 3,
          reserved_quantity: 0,
          low_stock_threshold: 3
        })),
        // Shirts
        ...SHIRT_SIZES.map(size => ({
          product_id: '7',
          size,
          stock_quantity: Math.floor(Math.random() * 30) + 10,
          reserved_quantity: 0,
          low_stock_threshold: 10
        })),
        // Shoes
        ...SHOE_SIZES.map(size => ({
          product_id: '13',
          size,
          stock_quantity: Math.floor(Math.random() * 10) + 2,
          reserved_quantity: 0,
          low_stock_threshold: 2
        })),
      ];

      const { error: insertError } = await supabase
        .from('inventory')
        .upsert(sampleInventory, { onConflict: 'product_id,size' });

      if (insertError) {
        console.error('Error inserting inventory:', insertError);
      } else {
        console.log(`Seeded inventory for ${sampleInventory.length} product-size combinations`);
      }
      return;
    }

    // Seed inventory for all products based on category
    const inventoryData = [];

    for (const product of products) {
      let sizes = [];
      let baseStock = 10;
      let lowThreshold = 3;

      switch (product.category) {
        case 'suits':
          sizes = SUIT_SIZES;
          baseStock = 15;
          lowThreshold = 5;
          break;
        case 'shirts':
          sizes = SHIRT_SIZES;
          baseStock = 25;
          lowThreshold = 10;
          break;
        case 'shoes':
          sizes = SHOE_SIZES;
          baseStock = 8;
          lowThreshold = 2;
          break;
        case 'accessories':
          sizes = ['One Size'];
          baseStock = 50;
          lowThreshold = 15;
          break;
        default:
          sizes = ['S', 'M', 'L', 'XL'];
          baseStock = 20;
          lowThreshold = 5;
      }

      for (const size of sizes) {
        // Random stock between 0 and baseStock * 2
        const stockQuantity = Math.floor(Math.random() * baseStock * 2);
        
        inventoryData.push({
          product_id: product.id,
          size,
          stock_quantity: stockQuantity,
          reserved_quantity: 0,
          low_stock_threshold: lowThreshold
        });
      }
    }

    // Insert inventory data
    const { error: insertError } = await supabase
      .from('inventory')
      .upsert(inventoryData, { onConflict: 'product_id,size' });

    if (insertError) {
      console.error('Error inserting inventory:', insertError);
    } else {
      console.log(`Successfully seeded inventory for ${inventoryData.length} product-size combinations`);
    }

    // Create some sample movements for history
    const { data: inventoryRecords } = await supabase
      .from('inventory')
      .select('id, product_id, size')
      .limit(10);

    if (inventoryRecords) {
      const movements = inventoryRecords.map(record => ({
        inventory_id: record.id,
        movement_type: 'adjustment',
        quantity: Math.floor(Math.random() * 10) + 1,
        reference_type: 'manual',
        notes: 'Initial stock'
      }));

      await supabase.from('inventory_movements').insert(movements);
      console.log('Created sample inventory movements');
    }

  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Run the seed
seedInventory();