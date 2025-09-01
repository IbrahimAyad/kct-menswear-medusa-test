/**
 * Format price from cents to display currency
 * Medusa stores prices in cents to avoid floating-point errors
 * 
 * @param amount - Price in cents (e.g., 9999 for $99.99)
 * @param currencyCode - Currency code (default: 'USD')
 * @returns Formatted price string (e.g., "$99.99")
 */
export const formatPrice = (amount: number | undefined | null, currencyCode: string = 'USD'): string => {
  if (!amount && amount !== 0) return '$0.00';
  
  // Handle different currencies
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // IMPORTANT: Divide by 100 to convert cents to dollars
  return formatter.format(amount / 100);
};

/**
 * Format price range for products with variants
 * @param variants - Product variants array
 * @returns Price range string (e.g., "$99.99" or "$99.99 - $199.99")
 */
export const formatPriceRange = (variants: any[]): string => {
  if (!variants || variants.length === 0) return '$0.00';
  
  const prices = variants.flatMap(v => 
    v.prices?.map((p: any) => p.amount) || []
  ).filter(Boolean);
  
  if (prices.length === 0) return '$0.00';
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

/**
 * Convert user input price to cents for backend
 * @param dollarAmount - Price in dollars (e.g., "99.99")
 * @returns Price in cents (e.g., 9999)
 */
export const priceToCents = (dollarAmount: string | number): number => {
  const amount = typeof dollarAmount === 'string' 
    ? parseFloat(dollarAmount) 
    : dollarAmount;
  
  return Math.round(amount * 100);
};