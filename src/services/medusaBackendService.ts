// Medusa Backend Service
// Uses CUSTOM endpoints specifically created for this project
// NOT standard Medusa v2 endpoints

import { medusaProductCache } from './medusaProductCache'

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

// Get API headers with publishable key
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
  }
}

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  price?: number
  pricing_tier?: string
  metadata?: {
    tier_price?: number
    pricing_tier?: string
  }
  variants?: Array<{
    id: string
    title: string
    sku?: string
    barcode?: string | null
    inventory_quantity?: number
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }>
  images?: Array<{
    url: string
  }>
  categories?: Array<any>
}

export interface MedusaCart {
  id: string
  cart_id?: string
  email?: string
  items: Array<{
    id: string
    variant_id: string
    quantity: number
    unit_price: number
    title: string
    thumbnail?: string
  }>
  shipping_address?: any
  billing_address?: any
  shipping_total?: number
  subtotal?: number
  total?: number
  client_secret?: string
}

// Fetch all Medusa products using CUSTOM endpoint with caching
export async function fetchMedusaProducts(): Promise<MedusaProduct[]> {
  const limit = 200
  const offset = 0
  
  // Check cache first
  const cached = medusaProductCache.get(limit, offset)
  if (cached) {
    return cached
  }
  
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    
    const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })

    console.log('Medusa API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Medusa API error:', errorText)
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []
    console.log('Medusa products fetched:', products.length)
    
    // Cache the results
    medusaProductCache.set(limit, offset, products)
    
    return products
  } catch (error) {
    console.error('Error fetching Medusa products:', error)
    return []
  }
}

// Fetch Medusa products with pagination
export async function fetchMedusaProductsPaginated(page: number = 1, pageSize: number = 20): Promise<{
  products: MedusaProduct[]
  hasMore: boolean
  total: number
  totalPages: number
}> {
  const offset = (page - 1) * pageSize
  
  // Check cache first
  const cached = medusaProductCache.get(pageSize, offset)
  if (cached) {
    const totalPages = Math.ceil(cached.length / pageSize)
    return {
      products: cached,
      hasMore: cached.length === pageSize,
      total: cached.length,
      totalPages
    }
  }
  
  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString()
    })
    
    const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []
    const total = data.count || products.length
    const totalPages = Math.ceil(total / pageSize)
    
    // Cache the results
    medusaProductCache.set(pageSize, offset, products)
    
    return {
      products,
      hasMore: products.length === pageSize,
      total,
      totalPages
    }
  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return { products: [], hasMore: false, total: 0, totalPages: 0 }
  }
}

// Get single product by handle
export async function fetchMedusaProductByHandle(handle: string): Promise<MedusaProduct | null> {
  try {
    // Fetch all products and find by handle
    // Since there's no single product endpoint, we fetch with a limit and search
    const products = await fetchMedusaProducts()
    const product = products.find(p => p.handle === handle || p.id === handle)
    return product || null
  } catch (error) {
    console.error('Error fetching Medusa product by handle:', error)
    return null
  }
}

// Alternative: Get product by ID from the list
export async function fetchMedusaProduct(productId: string): Promise<MedusaProduct | null> {
  try {
    const products = await fetchMedusaProducts()
    const product = products.find(p => p.id === productId)
    return product || null
  } catch (error) {
    console.error('Error fetching Medusa product:', error)
    return null
  }
}

// Initialize payment collection for cart (needed immediately after creation)
export async function initializeCartPayment(cartId: string): Promise<any | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'initialize_payment',
        cart_id: cartId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to initialize payment for cart: ${response.status} - ${errorText}`)
      // Don't throw - cart can still work for browsing
      return null
    }

    const data = await response.json()
    console.log('Payment collection initialized for cart:', cartId)
    return data
  } catch (error) {
    console.error('Error initializing cart payment:', error)
    // Don't throw - cart can still work for browsing
    return null
  }
}

// Create cart using CUSTOM endpoint (with automatic payment initialization)
export async function createMedusaCart(email?: string): Promise<MedusaCart | null> {
  try {
    // Step 1: Create the cart
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'create',
        customer_email: email || ''
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create cart: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const cartId = data.cart_id || data.id
    console.log('Cart created:', cartId)
    
    // Step 2: Initialize payment collection immediately
    // This prevents the "strategy" error when adding items
    if (cartId) {
      await initializeCartPayment(cartId)
    }
    
    return data
  } catch (error) {
    console.error('Error creating Medusa cart:', error)
    return null
  }
}

// Add item to cart using CUSTOM endpoint
export async function addToMedusaCart(cartId: string, variantId: string, quantity: number = 1): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_item',
        cart_id: cartId,
        variant_id: variantId,
        quantity: quantity
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error adding to Medusa cart:', error)
    return null
  }
}

// Update item quantity using CUSTOM endpoint
export async function updateMedusaCartItem(cartId: string, itemId: string, quantity: number): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'update_item',
        cart_id: cartId,
        item_id: itemId,
        quantity: quantity
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update cart item: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error updating cart item:', error)
    return null
  }
}

// Remove item from cart using CUSTOM endpoint
export async function removeFromMedusaCart(cartId: string, itemId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'remove_item',
        cart_id: cartId,
        item_id: itemId
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to remove from cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error removing from cart:', error)
    return null
  }
}

// Get cart using CUSTOM endpoint
export async function getMedusaCart(cartId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations?cart_id=${cartId}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      // Don't log error for 404s (cart not found is normal)
      if (response.status !== 404) {
        console.error(`Failed to get cart: ${response.status}`)
      }
      return null
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error getting cart:', error)
    return null
  }
}

// CHECKOUT FLOW using CUSTOM endpoint

// Step 1: Add shipping address
export async function addShippingAddress(cartId: string, shippingData: {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postal_code: string
  country_code?: string
  phone?: string
  email: string
}) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_shipping_address',
        cart_id: cartId,
        ...shippingData,
        country_code: shippingData.country_code || 'us'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add shipping address: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error adding shipping address:', error)
    return null
  }
}

// Step 2: Add shipping method
export async function addShippingMethod(cartId: string, shippingMethod: string = 'Standard Shipping', shippingAmount: number = 10) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_shipping_method',
        cart_id: cartId,
        shipping_method: shippingMethod,
        shipping_amount: shippingAmount
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add shipping method: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error adding shipping method:', error)
    return null
  }
}

// Step 3: Initialize payment
export async function initializeMedusaPayment(cartId: string) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'initialize_payment',
        cart_id: cartId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to initialize payment: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    // Returns: { client_secret, amount, payment_collection_id, payment_session_id }
    return data
  } catch (error) {
    console.error('Error initializing payment:', error)
    return null
  }
}

// Step 4: Complete order (after successful Stripe payment)
export async function completeMedusaOrder(cartId: string, paymentIntentId: string, paymentCollectionId: string) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'complete_order',
        cart_id: cartId,
        payment_intent_id: paymentIntentId,
        payment_collection_id: paymentCollectionId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to complete order: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    // Returns: { order_id, success }
    return data
  } catch (error) {
    console.error('Error completing order:', error)
    return null
  }
}

// Helper to get display price
export function getMedusaDisplayPrice(product: MedusaProduct): number {
  // Prices are already in dollars (not cents)
  if (product.price) return product.price
  if (product.metadata?.tier_price) return product.metadata.tier_price
  
  // Check variant prices
  if (product.variants?.length && product.variants[0].prices?.length) {
    return product.variants[0].prices[0].amount
  }
  
  return 0
}

// Helper to check product availability
export function isMedusaProductAvailable(product: MedusaProduct): boolean {
  return product.variants?.some(v => (v.inventory_quantity || 0) > 0) || false
}

// Helper to get product variant
export function getDefaultVariant(product: MedusaProduct) {
  return product.variants?.[0] || null
}