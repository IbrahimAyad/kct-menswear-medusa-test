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
    const response = await fetch(`${MEDUSA_URL}/store/products`, {
      headers: {
        'Content-Type': 'application/json',
        // Add key if required
        // 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
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
      },
      body: JSON.stringify({
        // Add region if needed
        // region_id: 'reg_xxx'
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