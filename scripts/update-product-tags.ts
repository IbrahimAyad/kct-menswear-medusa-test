/**
 * Script to update all product tags using the Smart Tagger
 * Run with: npx tsx scripts/update-product-tags.ts
 */

import { smartTagger } from '@/lib/ai/smart-tagger';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🏷️  Smart Tagger - Product Tag Update Script');
  console.log('============================================\n');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
  );
  
  // Get product count
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  if (countError) {
    console.error('❌ Error counting products:', countError);
    return;
  }
  
  console.log(`📊 Found ${count} active products to process\n`);
  
  // Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error || !products) {
    console.error('❌ Error fetching products:', error);
    return;
  }
  
  console.log('🔄 Processing products...\n');
  
  let processed = 0;
  let failed = 0;
  
  for (const product of products) {
    try {
      // Generate tags
      const tags = await smartTagger.generateTags(product);
      const tagArray = [...new Set(tags.map(t => t.tag))]; // Remove duplicates
      
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          tags: tagArray,
          tags_updated_at: new Date().toISOString()
        })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${product.name}:`, updateError.message);
        failed++;
      } else {
        processed++;
        console.log(`✅ Updated: ${product.name} (${tagArray.length} tags)`);
        
        // Show sample tags for first few products
        if (processed <= 3) {
          console.log(`   Tags: ${tagArray.slice(0, 10).join(', ')}${tagArray.length > 10 ? '...' : ''}\n`);
        }
      }
      
      // Progress indicator
      if (processed % 10 === 0) {
        console.log(`\n📈 Progress: ${processed}/${products.length} products\n`);
      }
      
    } catch (err) {
      console.error(`❌ Error processing ${product.name}:`, err);
      failed++;
    }
  }
  
  // Summary
  console.log('\n============================================');
  console.log('📊 Tag Update Summary:');
  console.log(`✅ Successfully updated: ${processed} products`);
  console.log(`❌ Failed: ${failed} products`);
  console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
  
  // Show tag statistics
  if (processed > 0) {
    const { data: taggedProducts } = await supabase
      .from('products')
      .select('tags')
      .eq('status', 'active')
      .not('tags', 'is', null);
    
    if (taggedProducts) {
      const allTags = taggedProducts.flatMap(p => p.tags || []);
      const uniqueTags = new Set(allTags);
      const tagCounts: Record<string, number> = {};
      
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log(`\n📊 Tag Statistics:`);
      console.log(`   Total unique tags: ${uniqueTags.size}`);
      console.log(`   Average tags per product: ${(allTags.length / taggedProducts.length).toFixed(1)}`);
      console.log(`\n   Top 10 Most Common Tags:`);
      topTags.forEach(([tag, count], index) => {
        console.log(`   ${index + 1}. "${tag}" - ${count} products`);
      });
    }
  }
  
  console.log('\n✨ Tag update complete!');
}

// Run the script
main().catch(console.error);