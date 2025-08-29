import { createClient } from '@supabase/supabase-js';
import productsData from '../kct_menswear_products_database.json';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Use service key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Product interface matching Supabase schema
interface Product {
  id?: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  price: number;
  sale_price?: number;
  description: string;
  features?: string[];
  materials?: string;
  care_instructions?: string;
  sizes: string[];
  colors: string[];
  images: {
    main: string;
    alternates?: string[];
    color_variants?: Record<string, string>;
  };
  stock_status: 'in_stock' | 'out_of_stock' | 'limited';
  tags?: string[];
  sku?: string;
  metadata?: Record<string, any>;
  is_featured?: boolean;
  is_new?: boolean;
  is_sale?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Map scraped data to Supabase schema
function mapToSupabaseProduct(scrapedProduct: any): Product {
  return {
    name: scrapedProduct.name,
    slug: generateSlug(scrapedProduct.name),
    category: scrapedProduct.category.toLowerCase().replace(' ', '_'),
    subcategory: scrapedProduct.subcategory?.toLowerCase().replace(' ', '_'),
    price: scrapedProduct.price,
    sale_price: scrapedProduct.salePrice,
    description: scrapedProduct.description || '',
    features: scrapedProduct.features || [],
    materials: scrapedProduct.materials,
    care_instructions: scrapedProduct.careInstructions,
    sizes: scrapedProduct.sizes || [],
    colors: scrapedProduct.colors || [],
    images: {
      main: scrapedProduct.images?.main || scrapedProduct.image,
      alternates: scrapedProduct.images?.alternates || [],
      color_variants: scrapedProduct.images?.colorVariants || {}
    },
    stock_status: scrapedProduct.inStock ? 'in_stock' : 'out_of_stock',
    tags: scrapedProduct.tags || [],
    sku: scrapedProduct.sku,
    metadata: {
      original_url: scrapedProduct.url,
      scraped_date: productsData.metadata.scrapedDate
    },
    is_featured: false,
    is_new: false,
    is_sale: !!scrapedProduct.salePrice
  };
}

async function importProducts() {
  console.log('🚀 Starting product import to Supabase...');
  
  try {
    // First, check if products table exists
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('📦 Creating products table...');
      
      // Create products table
      const { error: createError } = await supabase.rpc('create_products_table', {
        sql: `
          CREATE TABLE IF NOT EXISTS products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            price DECIMAL(10,2) NOT NULL,
            sale_price DECIMAL(10,2),
            description TEXT,
            features TEXT[],
            materials TEXT,
            care_instructions TEXT,
            sizes TEXT[],
            colors TEXT[],
            images JSONB,
            stock_status TEXT DEFAULT 'in_stock',
            tags TEXT[],
            sku TEXT,
            metadata JSONB,
            is_featured BOOLEAN DEFAULT false,
            is_new BOOLEAN DEFAULT false,
            is_sale BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX idx_products_slug ON products(slug);
          CREATE INDEX idx_products_category ON products(category);
          CREATE INDEX idx_products_subcategory ON products(subcategory);
          CREATE INDEX idx_products_tags ON products USING gin(tags);
        `
      });
      
      if (createError) {
        console.error('Error creating table:', createError);
        return;
      }
    }
    
    // Map all products
    const productsToImport = productsData.products.map(mapToSupabaseProduct);
    
    console.log(`📊 Importing ${productsToImport.length} products...`);
    
    // Import in batches of 50
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < productsToImport.length; i += batchSize) {
      const batch = productsToImport.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('products')
        .upsert(batch, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
      } else {
        imported += data.length;
        console.log(`✅ Imported ${imported}/${productsToImport.length} products`);
      }
    }
    
    // Create categories table
    console.log('📁 Creating categories...');
    
    const categories = Object.entries(productsData.categories).map(([key, value]) => ({
      slug: key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      product_count: (value as any).products?.length || 0,
      subcategories: Object.keys((value as any).subcategories || {})
    }));
    
    const { error: catError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'slug' });
    
    if (catError) {
      console.error('Error creating categories:', catError);
    }
    
    // Create product_views table for analytics
    console.log('📊 Setting up analytics tables...');
    
    const { error: viewsError } = await supabase.rpc('create_analytics_tables', {
      sql: `
        CREATE TABLE IF NOT EXISTS product_views (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID REFERENCES products(id),
          session_id TEXT,
          user_id UUID,
          viewed_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS product_recommendations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID REFERENCES products(id),
          recommended_product_id UUID REFERENCES products(id),
          score DECIMAL(3,2),
          reason TEXT
        );
        
        CREATE INDEX idx_product_views_product ON product_views(product_id);
        CREATE INDEX idx_product_views_session ON product_views(session_id);
      `
    });
    
    if (viewsError) {
      console.error('Error creating analytics tables:', viewsError);
    }
    
    console.log('✨ Product import completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - Products imported: ${imported}`);
    console.log(`   - Categories created: ${categories.length}`);
    console.log(`   - Price range: $${productsData.metadata.priceRange.min} - $${productsData.metadata.priceRange.max}`);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  }
}

// Run the import
importProducts();