/**
 * KCT Menswear Pricing System - Medusa 2.0 Clean Implementation
 * Backend deployment ready - removes all workarounds and legacy code
 */

/**
 * Get the price from a product variant
 * @param variant - Variant object from Medusa API
 * @returns Price in dollars (converted from cents)
 */
export const getProductPrice = (variant: any): string => {
  // Only use calculated_price from Medusa 2.0
  const amountInCents = variant?.calculated_price?.calculated_amount || 0
  const amountInDollars = amountInCents / 100
  return amountInDollars.toFixed(2)
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