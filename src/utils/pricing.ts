/**
 * KCT Menswear Pricing System - SINGLE SOURCE OF TRUTH
 * 
 * CRITICAL: Our custom API returns prices in DOLLARS, not cents!
 * Do NOT divide by 100 - prices are already in the correct format
 * 
 * Custom API structure:
 * - product.price: number (dollars)
 * - product.metadata.tier_price: number (dollars)
 * - variant.price: number (dollars)
 * - NO variant.prices array exists in our API!
 */

interface KCTProduct {
  id: string;
  title: string;
  price?: number; // Direct price in dollars from custom API
  metadata?: {
    tier_price?: number; // Price in dollars
    tier?: string;
  };
  variants?: Array<{
    id: string;
    title: string;
    price?: number; // Direct price in dollars
    // NO prices array in our custom API!
  }>;
}

/**
 * Get the price from a product or variant
 * Priority: direct price > metadata.tier_price > first variant price
 */
export const getProductPrice = (product: KCTProduct | any): number => {
  // Debug logging
  console.log('[getProductPrice] Input:', product);
  
  // Your custom API provides price directly in DOLLARS
  if (product?.price !== undefined && product.price !== null) {
    console.log('[getProductPrice] Found product.price:', product.price);
    return Number(product.price); // Already in dollars!
  }
  
  if (product?.metadata?.tier_price !== undefined && product.metadata.tier_price !== null) {
    console.log('[getProductPrice] Found metadata.tier_price:', product.metadata.tier_price);
    return Number(product.metadata.tier_price); // Already in dollars!
  }
  
  if (product?.variants?.[0]?.price !== undefined && product.variants[0].price !== null) {
    console.log('[getProductPrice] Found variants[0].price:', product.variants[0].price);
    return Number(product.variants[0].price); // Already in dollars!
  }
  
  console.log('[getProductPrice] No price found, returning 0');
  return 0;
};

/**
 * Get the price from a specific variant
 */
export const getVariantPrice = (variant: any): number => {
  if (variant?.price !== undefined && variant.price !== null) {
    return Number(variant.price); // Already in dollars!
  }
  return 0;
};

/**
 * Format a price for display
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '$0.00';
  return `$${numPrice.toFixed(2)}`;
};

/**
 * Get formatted display price for a product
 */
export const getProductDisplayPrice = (product: KCTProduct | any): string => {
  const price = getProductPrice(product);
  return formatPrice(price);
};

/**
 * Get formatted display price for a variant
 */
export const getVariantDisplayPrice = (variant: any): string => {
  const price = getVariantPrice(variant);
  return formatPrice(price);
};

/**
 * Check if a variant is available (for our system, always true)
 */
export const isVariantAvailable = (variant: any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true;
};

/**
 * Check if any variant of a product is available (always true for us)
 */
export const isProductAvailable = (product: KCTProduct | any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true;
};

// Cart item price (might have different structure)
export const getCartItemPrice = (item: any): number => {
  // Check if cart returns different structure
  if (item?.unit_price !== undefined) {
    // Cart might store price differently - verify this
    return Number(item.unit_price);
  }
  
  // Fall back to product price
  if (item?.product) {
    return getProductPrice(item.product);
  }
  
  return getProductPrice(item);
};

/**
 * System configuration for reference
 */
export const PRICE_SYSTEM = {
  source: 'Custom API - product.price or metadata.tier_price',
  format: 'DOLLARS (not cents)',
  divide_by_100: false,
  multiply_by_100: false,
  unlimited_inventory: true,
  manage_inventory: false
};

// Debug helper to understand data structure
export const debugProductStructure = (product: any): void => {
  console.log('=== PRODUCT STRUCTURE DEBUG ===');
  console.log('Full product:', product);
  console.log('Has product.price?', product?.price);
  console.log('Has metadata.tier_price?', product?.metadata?.tier_price);
  console.log('Has variants[0].price?', product?.variants?.[0]?.price);
  console.log('Has variants[0].prices array?', product?.variants?.[0]?.prices);
  console.log('Calculated price:', getProductPrice(product));
  console.log('Display price:', getProductDisplayPrice(product));
  console.log('===============================');
};