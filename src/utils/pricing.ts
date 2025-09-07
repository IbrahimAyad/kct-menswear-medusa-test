/**
 * KCT Menswear Pricing System - SINGLE SOURCE OF TRUTH
 * 
 * BACKEND UPDATE (Admin fix - pending deployment):
 * The backend now properly returns prices in CENTS from Medusa's Pricing Module
 * - product.price = Minimum variant price (for product cards/lists) - IN CENTS
 * - variant.calculated_price.calculated_amount = Specific variant price - IN CENTS
 * 
 * IMPORTANT: Always divide by 100 to convert cents to dollars for display
 * Backend cache TTL is 60 seconds (not 30 minutes)
 */

interface KCTProduct {
  id: string;
  title: string;
  price?: number; // Minimum variant price in CENTS (after backend fix)
  metadata?: {
    tier_price?: number; // Legacy field (can be removed after deployment)
    tier?: string;
  };
  variants?: Array<{
    id: string;
    title: string;
    price?: number; // Variant price in CENTS (fallback)
    calculated_price?: {
      calculated_amount: number; // Price in CENTS from Pricing Module
      currency_code: string;
    };
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
}

/**
 * Get the price from a product or variant
 * @param product - Product object from API
 * @param variant - Optional specific variant (for product detail page)
 * @returns Price in dollars (not cents)
 * 
 * Priority order (per admin's specification):
 * 1. variant.calculated_price.calculated_amount (most accurate)
 * 2. variant.price (fallback if exists)  
 * 3. product.price (convenience field - minimum of all variant prices)
 */
export const getProductPrice = (product: KCTProduct | any, variant?: any): number => {
  // If specific variant provided, use its price (most accurate)
  if (variant?.calculated_price?.calculated_amount !== undefined) {
    return Number(variant.calculated_price.calculated_amount) / 100;
  }
  
  // If variant has direct price field
  if (variant?.price !== undefined && variant.price > 0) {
    return Number(variant.price) / 100;
  }

  // For product listing, use product.price (minimum of all variants)
  // This is a convenience field from backend
  if (product?.price !== undefined && product.price > 0) {
    return Number(product.price) / 100;
  }

  // Fallback to first variant's calculated price
  if (product?.variants?.[0]?.calculated_price?.calculated_amount !== undefined) {
    return Number(product.variants[0].calculated_price.calculated_amount) / 100;
  }
  
  // Fallback to first variant's direct price
  if (product?.variants?.[0]?.price !== undefined && product.variants[0].price > 0) {
    return Number(product.variants[0].price) / 100;
  }

  // Old structure fallbacks (can remove after deployment verified)
  // Check metadata tier price (should be in dollars already)
  if (product?.metadata?.tier_price !== undefined) {
    const tierPrice = Number(product.metadata.tier_price);
    // If it's a large number, assume it's in cents
    return tierPrice > 1000 ? tierPrice / 100 : tierPrice;
  }

  // Legacy fields
  if (product?.base_price !== undefined) {
    return Number(product.base_price);
  }

  if (product?.original_price !== undefined) {
    return Number(product.original_price);
  }
  
  return 0;
};

/**
 * Get the price from a specific variant
 */
export const getVariantPrice = (variant: any): number => {
  // PRIORITY 1: Check for calculated_price (Medusa 2.0 standard)
  if (variant?.calculated_price?.calculated_amount !== undefined) {
    const amount = Number(variant.calculated_price.calculated_amount);
    // Amount is in CENTS (19999 = $199.99), divide by 100
    return amount / 100;
  }
  
  // PRIORITY 2: Check for prices array (if expanded)
  if (variant?.prices?.length > 0) {
    const usdPrice = variant.prices.find((p: any) => p.currency_code === 'usd') || variant.prices[0];
    if (usdPrice?.amount !== undefined) {
      const amount = Number(usdPrice.amount);
      // Amount is in CENTS, divide by 100
      return amount / 100;
    }
  }
  
  // PRIORITY 3: Legacy direct price field
  if (variant?.price !== undefined && variant.price !== null) {
    const price = Number(variant.price);
    // Check if it's cents or dollars
    return price > 1000 ? price / 100 : price;
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
  source: 'Medusa 2.0 Pricing Module via Remote Query API',
  format: 'CENTS (requires division by 100)',
  divide_by_100: true,
  multiply_by_100: false,
  unlimited_inventory: true,
  manage_inventory: false,
  cache_ttl: 60, // Backend cache is 60 seconds
  region: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD' // US region for pricing
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