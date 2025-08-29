import { createClient } from '@supabase/supabase-js';
import kctCompleteProducts from '../kct_complete_products_database.json';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MergedProduct {
  // From Supabase
  id: string;
  name: string;
  slug?: string;
  price: number;
  sale_price?: number;
  description?: string;
  product_type?: string;
  vendor?: string;
  tags?: string[];
  images?: any[];
  variants?: any[];
  status?: string;
  
  // From KCT Knowledge Base
  kct_data?: {
    seoTitle?: string;
    metaDescription?: string;
    materials?: string;
    features?: string[];
    colors?: string[];
    sizes?: string[];
    sku?: string;
    rating?: number;
    reviews?: number;
    care?: string;
    matchingItems?: string[];
    weddingStyle?: string[];
    foldingStyles?: string[];
    occasions?: string[];
  };
  
  // AI Training Data
  ai_training?: {
    style_descriptors?: string[];
    color_coordination?: string[];
    outfit_suggestions?: string[];
    occasion_recommendations?: string[];
    care_instructions?: string;
    material_properties?: string[];
  };
}

async function mergeProductsWithKnowledge() {
  console.log('🔄 Starting product knowledge base merge...');
  
  try {
    // Step 1: Fetch all products from Supabase
    console.log('📦 Fetching products from Supabase...');
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`✅ Found ${supabaseProducts?.length || 0} products in Supabase`);
    
    // Step 2: Create a map of KCT products for quick lookup
    const kctProductMap = new Map();
    
    // Flatten all KCT products from collections
    Object.values(kctCompleteProducts.collections).forEach((collection: any) => {
      if (collection.products) {
        collection.products.forEach((product: any) => {
          // Try multiple matching strategies
          const possibleKeys = [
            product.id,
            product.sku,
            product.name.toLowerCase().replace(/\s+/g, '-'),
            product.name
          ];
          
          possibleKeys.forEach(key => {
            if (key) kctProductMap.set(key, product);
          });
        });
      }
    });
    
    console.log(`✅ Indexed ${kctProductMap.size / 4} unique KCT products`);
    
    // Step 3: Merge products
    const mergedProducts: MergedProduct[] = [];
    let matchCount = 0;
    
    supabaseProducts?.forEach(supabaseProduct => {
      // Try to find matching KCT product
      let kctProduct = null;
      
      // Try matching by different fields
      const matchAttempts = [
        supabaseProduct.id,
        supabaseProduct.slug,
        supabaseProduct.name?.toLowerCase().replace(/\s+/g, '-'),
        supabaseProduct.name
      ];
      
      for (const attempt of matchAttempts) {
        if (attempt && kctProductMap.has(attempt)) {
          kctProduct = kctProductMap.get(attempt);
          matchCount++;
          break;
        }
      }
      
      // Create merged product
      const merged: MergedProduct = {
        ...supabaseProduct,
        kct_data: kctProduct ? {
          seoTitle: kctProduct.seoTitle,
          metaDescription: kctProduct.metaDescription,
          materials: kctProduct.materials,
          features: kctProduct.features,
          colors: kctProduct.colors,
          sizes: kctProduct.sizes,
          sku: kctProduct.sku,
          rating: kctProduct.rating,
          reviews: kctProduct.reviews,
          care: kctProduct.care,
          matchingItems: kctProduct.matchingItems,
          weddingStyle: kctProduct.weddingStyle,
          foldingStyles: kctProduct.foldingStyles
        } : undefined,
        ai_training: generateAITrainingData(supabaseProduct, kctProduct)
      };
      
      mergedProducts.push(merged);
    });
    
    console.log(`✅ Matched ${matchCount} products with KCT data`);
    
    // Step 4: Add KCT products that aren't in Supabase (for knowledge base only)
    const supabaseIds = new Set(supabaseProducts?.map(p => p.id));
    const supabaseNames = new Set(supabaseProducts?.map(p => p.name?.toLowerCase()));
    
    let additionalKCTProducts = 0;
    Object.values(kctCompleteProducts.collections).forEach((collection: any) => {
      if (collection.products) {
        collection.products.forEach((kctProduct: any) => {
          const isInSupabase = supabaseIds.has(kctProduct.id) || 
                               supabaseNames.has(kctProduct.name?.toLowerCase());
          
          if (!isInSupabase) {
            additionalKCTProducts++;
            mergedProducts.push({
              id: kctProduct.id,
              name: kctProduct.name,
              price: kctProduct.price,
              sale_price: kctProduct.salePrice,
              description: kctProduct.description,
              product_type: kctProduct.category,
              tags: kctProduct.tags,
              status: 'knowledge_only', // Mark as knowledge base only
              kct_data: {
                seoTitle: kctProduct.seoTitle,
                metaDescription: kctProduct.metaDescription,
                materials: kctProduct.materials,
                features: kctProduct.features,
                colors: kctProduct.colors,
                sizes: kctProduct.sizes,
                sku: kctProduct.sku,
                rating: kctProduct.rating,
                reviews: kctProduct.reviews
              },
              ai_training: generateAITrainingData(null, kctProduct)
            });
          }
        });
      }
    });
    
    console.log(`✅ Added ${additionalKCTProducts} KCT-only products to knowledge base`);
    
    // Step 5: Create comprehensive training dataset
    const trainingDataset = {
      metadata: {
        totalProducts: mergedProducts.length,
        supabaseProducts: supabaseProducts?.length || 0,
        kctProducts: kctProductMap.size / 4,
        matchedProducts: matchCount,
        kctOnlyProducts: additionalKCTProducts,
        generatedDate: new Date().toISOString(),
        seoInsights: kctCompleteProducts.seo_insights,
        trainingDataSummary: kctCompleteProducts.training_data_summary
      },
      products: mergedProducts,
      categories: extractCategories(mergedProducts),
      colorPalette: extractColorPalette(mergedProducts),
      sizeChart: extractSizeChart(mergedProducts),
      materials: extractMaterials(mergedProducts),
      occasions: extractOccasions(mergedProducts),
      styleGuide: generateStyleGuide(mergedProducts)
    };
    
    // Step 6: Save the merged dataset
    const outputPath = path.join(process.cwd(), 'ai_training_dataset.json');
    fs.writeFileSync(outputPath, JSON.stringify(trainingDataset, null, 2));
    
    console.log('✨ Knowledge base merge completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total products in dataset: ${mergedProducts.length}`);
    console.log(`   - Products from Supabase: ${supabaseProducts?.length || 0}`);
    console.log(`   - Products matched with KCT data: ${matchCount}`);
    console.log(`   - Additional KCT products for training: ${additionalKCTProducts}`);
    console.log(`   - Output saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error during merge:', error);
  }
}

// Helper function to generate AI training data
function generateAITrainingData(supabaseProduct: any, kctProduct: any): any {
  const training: any = {};
  
  // Extract style descriptors
  const description = kctProduct?.description || supabaseProduct?.description || '';
  const title = kctProduct?.seoTitle || supabaseProduct?.name || '';
  
  training.style_descriptors = extractStyleDescriptors(description + ' ' + title);
  
  // Color coordination suggestions
  if (kctProduct?.colors || supabaseProduct?.product_variants) {
    training.color_coordination = generateColorSuggestions(
      kctProduct?.colors || extractColorsFromVariants(supabaseProduct?.product_variants)
    );
  }
  
  // Outfit suggestions based on product type
  const productType = kctProduct?.category || supabaseProduct?.product_type;
  if (productType) {
    training.outfit_suggestions = generateOutfitSuggestions(productType);
  }
  
  // Occasion recommendations
  if (kctProduct?.tags || supabaseProduct?.tags) {
    training.occasion_recommendations = extractOccasionRecommendations(
      [...(kctProduct?.tags || []), ...(supabaseProduct?.tags || [])]
    );
  }
  
  // Care instructions
  training.care_instructions = kctProduct?.care || generateCareInstructions(kctProduct?.materials);
  
  // Material properties
  if (kctProduct?.materials) {
    training.material_properties = extractMaterialProperties(kctProduct.materials);
  }
  
  return training;
}

// Helper functions for extraction
function extractStyleDescriptors(text: string): string[] {
  const descriptors: string[] = [];
  const styleWords = ['slim', 'modern', 'classic', 'tailored', 'relaxed', 'fitted', 'luxury', 'premium', 'elegant', 'sophisticated', 'bold', 'statement', 'versatile', 'timeless'];
  
  styleWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      descriptors.push(word);
    }
  });
  
  return descriptors;
}

function generateColorSuggestions(colors: string[]): string[] {
  const suggestions: string[] = [];
  
  colors.forEach(color => {
    const colorLower = color.toLowerCase();
    if (colorLower.includes('navy')) {
      suggestions.push('Pairs well with: brown, grey, white, burgundy');
    } else if (colorLower.includes('black')) {
      suggestions.push('Pairs well with: any color, especially white, grey, red');
    } else if (colorLower.includes('grey') || colorLower.includes('charcoal')) {
      suggestions.push('Pairs well with: navy, burgundy, black, white');
    } else if (colorLower.includes('burgundy')) {
      suggestions.push('Pairs well with: navy, grey, beige, white');
    }
  });
  
  return suggestions;
}

function generateOutfitSuggestions(productType: string): string[] {
  const suggestions: string[] = [];
  const type = productType.toLowerCase();
  
  if (type.includes('suit') || type.includes('tuxedo')) {
    suggestions.push('Complete with dress shirt, tie, dress shoes, and belt');
    suggestions.push('Add pocket square for formal events');
    suggestions.push('Consider cufflinks for French cuff shirts');
  } else if (type.includes('blazer')) {
    suggestions.push('Pair with dress pants or dark jeans');
    suggestions.push('Layer over dress shirt or turtleneck');
    suggestions.push('Complete with loafers or dress shoes');
  } else if (type.includes('tie') || type.includes('bowtie')) {
    suggestions.push('Match with suit or blazer in complementary color');
    suggestions.push('Consider matching pocket square');
    suggestions.push('Ensure proper length - tip should reach belt buckle');
  }
  
  return suggestions;
}

function extractOccasionRecommendations(tags: string[]): string[] {
  const occasions: string[] = [];
  const occasionMap: Record<string, string> = {
    'prom': 'Perfect for prom night and formal dances',
    'wedding': 'Ideal for weddings as guest or groomsman',
    'business': 'Suitable for business meetings and interviews',
    'formal': 'Appropriate for black-tie and formal events',
    'casual': 'Great for smart casual and date nights'
  };
  
  tags.forEach(tag => {
    const tagLower = tag.toLowerCase();
    Object.keys(occasionMap).forEach(key => {
      if (tagLower.includes(key)) {
        occasions.push(occasionMap[key]);
      }
    });
  });
  
  return [...new Set(occasions)];
}

function generateCareInstructions(materials?: string): string {
  if (!materials) return 'Follow care label instructions';
  
  const materialLower = materials.toLowerCase();
  if (materialLower.includes('wool')) {
    return 'Dry clean recommended. Store on proper hanger. Steam to remove wrinkles.';
  } else if (materialLower.includes('cotton')) {
    return 'Machine wash cold, tumble dry low. Iron if needed.';
  } else if (materialLower.includes('silk')) {
    return 'Dry clean only. Store away from direct sunlight.';
  } else if (materialLower.includes('velvet')) {
    return 'Dry clean only. Use velvet brush to maintain texture. Hang on padded hanger.';
  } else if (materialLower.includes('polyester') || materialLower.includes('microfiber')) {
    return 'Machine wash cold, hang dry. Wrinkle resistant.';
  }
  
  return 'Follow care label instructions';
}

function extractMaterialProperties(materials: string): string[] {
  const properties: string[] = [];
  const materialLower = materials.toLowerCase();
  
  if (materialLower.includes('wool')) {
    properties.push('Breathable', 'Temperature regulating', 'Wrinkle resistant', 'Durable');
  }
  if (materialLower.includes('cotton')) {
    properties.push('Breathable', 'Comfortable', 'Easy care', 'Natural fiber');
  }
  if (materialLower.includes('velvet')) {
    properties.push('Luxurious texture', 'Rich appearance', 'Special occasion appropriate');
  }
  if (materialLower.includes('silk') || materialLower.includes('satin')) {
    properties.push('Smooth texture', 'Lustrous finish', 'Formal appearance');
  }
  
  return properties;
}

function extractColorsFromVariants(variants: any[]): string[] {
  if (!variants) return [];
  return [...new Set(variants.map(v => v.color).filter(Boolean))];
}

function extractCategories(products: MergedProduct[]): string[] {
  const categories = new Set<string>();
  products.forEach(p => {
    if (p.product_type) categories.add(p.product_type);
    if (p.kct_data?.features) {
      p.kct_data.features.forEach(f => categories.add(f));
    }
  });
  return Array.from(categories);
}

function extractColorPalette(products: MergedProduct[]): Record<string, number> {
  const colorCount: Record<string, number> = {};
  products.forEach(p => {
    if (p.kct_data?.colors) {
      p.kct_data.colors.forEach(color => {
        colorCount[color] = (colorCount[color] || 0) + 1;
      });
    }
  });
  return colorCount;
}

function extractSizeChart(products: MergedProduct[]): Record<string, string[]> {
  const sizesByCategory: Record<string, Set<string>> = {};
  products.forEach(p => {
    const category = p.product_type || 'Other';
    if (!sizesByCategory[category]) {
      sizesByCategory[category] = new Set();
    }
    if (p.kct_data?.sizes) {
      p.kct_data.sizes.forEach(size => sizesByCategory[category].add(size));
    }
  });
  
  const result: Record<string, string[]> = {};
  Object.entries(sizesByCategory).forEach(([cat, sizes]) => {
    result[cat] = Array.from(sizes).sort();
  });
  return result;
}

function extractMaterials(products: MergedProduct[]): string[] {
  const materials = new Set<string>();
  products.forEach(p => {
    if (p.kct_data?.materials) {
      materials.add(p.kct_data.materials);
    }
  });
  return Array.from(materials);
}

function extractOccasions(products: MergedProduct[]): string[] {
  const occasions = new Set<string>();
  products.forEach(p => {
    if (p.kct_data?.weddingStyle) {
      p.kct_data.weddingStyle.forEach(style => occasions.add(style));
    }
    if (p.ai_training?.occasion_recommendations) {
      p.ai_training.occasion_recommendations.forEach(occ => occasions.add(occ));
    }
  });
  return Array.from(occasions);
}

function generateStyleGuide(products: MergedProduct[]): any {
  return {
    formalWear: {
      tuxedos: products.filter(p => p.product_type?.toLowerCase().includes('tuxedo')).length,
      suits: products.filter(p => p.product_type?.toLowerCase().includes('suit')).length,
      description: 'Black-tie and formal event attire'
    },
    businessWear: {
      count: products.filter(p => p.tags?.includes('business')).length,
      description: 'Professional and corporate attire'
    },
    casualWear: {
      count: products.filter(p => p.tags?.includes('casual')).length,
      description: 'Smart casual and everyday wear'
    },
    accessories: {
      ties: products.filter(p => p.product_type?.toLowerCase().includes('tie')).length,
      bowties: products.filter(p => p.product_type?.toLowerCase().includes('bowtie')).length,
      description: 'Completing touches for any outfit'
    }
  };
}

// Run the merge
mergeProductsWithKnowledge();