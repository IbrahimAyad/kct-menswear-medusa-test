/**
 * KCT Menswear Pricing System - Handles both backend response structures
 * Supports both product.price and variant.calculated_price formats
 */

/**
 * Get the price from a product or variant
 * Handles multiple data structures from backend
 * @param productOrVariant - Product or Variant object from Medusa API
 * @returns Price in dollars (converted from cents)
 */
export const getProductPrice = (productOrVariant: any): string => {
  // Case 1: Direct product with price field (product listing)
  if (productOrVariant?.price !== undefined && !productOrVariant?.calculated_price) {
    const priceInCents = productOrVariant.price
    return (priceInCents / 100).toFixed(2)
  }
  
  // Case 2: Variant with calculated_price (product detail)
  if (productOrVariant?.calculated_price?.calculated_amount !== undefined) {
    const amountInCents = productOrVariant.calculated_price.calculated_amount
    return (amountInCents / 100).toFixed(2)
  }
  
  // Case 3: Product with variants array
  if (productOrVariant?.variants?.[0]?.calculated_price?.calculated_amount !== undefined) {
    const amountInCents = productOrVariant.variants[0].calculated_price.calculated_amount
    return (amountInCents / 100).toFixed(2)
  }
  
  // Case 4: Product with variants that have price field
  if (productOrVariant?.variants?.[0]?.price !== undefined) {
    const priceInCents = productOrVariant.variants[0].price
    return (priceInCents / 100).toFixed(2)
  }
  
  // Fallback
  return '0.00'
}

/**
 * Get price as a number (for calculations)
 * @param productOrVariant - Product or Variant object
 * @returns Price as number in dollars
 */
export const getProductPriceAsNumber = (productOrVariant: any): number => {
  const priceString = getProductPrice(productOrVariant)
  return parseFloat(priceString)
}

/**
 * Format price amount in cents to dollars
 * @param amountInCents - Price in cents
 * @returns Formatted price string
 */
export const formatPrice = (amountInCents: number): string => {
  return `${(amountInCents / 100).toFixed(2)}`
}

/**
 * Check if a variant is available (for our system, always true)
 */
export const isVariantAvailable = (variant: any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true;
}

/**
 * Check if any variant of a product is available (always true for us)
 */
export const isProductAvailable = (product: any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true;
}