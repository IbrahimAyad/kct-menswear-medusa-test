/**
 * KCT Menswear Pricing System - Simplified after backend standardization
 * Backend now ONLY uses calculated_price.calculated_amount (in cents)
 */

/**
 * Get the price from a product or variant
 * Backend standardized to only use calculated_price.calculated_amount
 * @param productOrVariant - Product or Variant object from Medusa API
 * @returns Price in dollars (converted from cents)
 */
export const getProductPrice = (productOrVariant: any): string => {
  // Case 1: Direct variant with calculated_price
  if (productOrVariant?.calculated_price?.calculated_amount !== undefined) {
    const amountInCents = productOrVariant.calculated_price.calculated_amount
    return (amountInCents / 100).toFixed(2)
  }
  
  // Case 2: Product with variants array - check first variant
  if (productOrVariant?.variants?.[0]?.calculated_price?.calculated_amount !== undefined) {
    const amountInCents = productOrVariant.variants[0].calculated_price.calculated_amount
    return (amountInCents / 100).toFixed(2)
  }
  
  // Case 3: Single variant property
  if (productOrVariant?.variant?.calculated_price?.calculated_amount !== undefined) {
    const amountInCents = productOrVariant.variant.calculated_price.calculated_amount
    return (amountInCents / 100).toFixed(2)
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