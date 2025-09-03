// Medusa Backend Service
// Connects to the Medusa admin backend for extended catalog products

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  metadata?: {
    tier_price?: number
    pricing_tier?: string
  }
  variants?: Array<{
    id: string
    title: string
    prices?: Array<{
      amount: number
      currency_code: string
    }>
    inventory_quantity?: number
  }>
  images?: Array<{
    url: string
  }>
}

export interface MedusaCart {
  id: string
  email?: string
  items: any[]
  shipping_address?: any
  billing_address?: any
  payment_sessions?: any[]
  total?: number
}

// Fetch all Medusa products
export async function fetchMedusaProducts(): Promise<MedusaProduct[]> {
  try {
    // Simplified query without expand/fields (not supported by this Medusa version)
    const params = new URLSearchParams({
      limit: '100',
      // Include region if needed
      ...(process.env.NEXT_PUBLIC_MEDUSA_REGION_ID && {
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
      })
    })
    
    const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Include the publishable key
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      }
    })

    console.log('Medusa API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Medusa API error:', errorText)
      throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Medusa products fetched:', data.products?.length || 0)
    return data.products || []
  } catch (error) {
    console.error('Error fetching Medusa products:', error)
    return []
  }
}

// Create a new Medusa cart
export async function createMedusaCart(): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include the publishable key
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      },
      body: JSON.stringify({
        // Include region ID from environment
        ...(process.env.NEXT_PUBLIC_MEDUSA_REGION_ID && {
          region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
        }),
        // Include sales channel if available
        ...(process.env.NEXT_PUBLIC_SALES_CHANNEL_ID && {
          sales_channel_id: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID
        })
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error creating Medusa cart:', error)
    return null
  }
}

// Add item to Medusa cart
export async function addToMedusaCart(cartId: string, variantId: string, quantity: number = 1) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      },
      body: JSON.stringify({
        variant_id: variantId,
        quantity: quantity
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to add to cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error adding to Medusa cart:', error)
    return null
  }
}

// Update cart with customer info
export async function updateMedusaCart(cartId: string, updates: any) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`Failed to update cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error updating Medusa cart:', error)
    return null
  }
}

// Initialize payment session
export async function initializeMedusaPayment(cartId: string) {
  try {
    // Create payment sessions
    const createResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      }
    })

    if (!createResponse.ok) {
      throw new Error(`Failed to create payment sessions: ${createResponse.status}`)
    }

    // Select Stripe as provider
    const selectResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/payment-sessions/pp_stripe_stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      }
    })

    if (!selectResponse.ok) {
      throw new Error(`Failed to select payment provider: ${selectResponse.status}`)
    }

    const data = await selectResponse.json()
    return data.cart
  } catch (error) {
    console.error('Error initializing payment:', error)
    return null
  }
}

// Complete cart/order
export async function completeMedusaCart(cartId: string) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to complete cart: ${response.status}`)
    }

    const data = await response.json()
    return data.data // Returns order
  } catch (error) {
    console.error('Error completing cart:', error)
    return null
  }
}

// Helper to get display price
export function getMedusaDisplayPrice(product: MedusaProduct): number {
  // Prices are already in dollars!
  return product.metadata?.tier_price || 0
}

// Helper to check product availability
export function isMedusaProductAvailable(product: MedusaProduct): boolean {
  return product.variants?.some(v => (v.inventory_quantity || 0) > 0) || false
}