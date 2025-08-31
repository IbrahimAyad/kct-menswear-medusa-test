import { medusa, MEDUSA_CONFIG } from './client'
import { useCartStore } from '@/lib/store/cartStore'
import { Product } from '@/lib/types'

interface MedusaCart {
  id: string
  region_id: string
  items: Array<{
    id: string
    variant_id: string
    quantity: number
    product: any
    variant: any
  }>
  total: number
  subtotal: number
  shipping_total: number
  tax_total: number
}

export class CartAdapter {
  private medusaCartId: string | null = null
  private medusaCart: MedusaCart | null = null

  constructor() {
    // Initialize from localStorage if exists
    if (typeof window !== 'undefined') {
      this.medusaCartId = localStorage.getItem('medusa_cart_id')
    }
  }

  /**
   * Initialize or retrieve Medusa cart
   */
  async initialize(): Promise<MedusaCart> {
    try {
      // Try to retrieve existing cart
      if (this.medusaCartId) {
        try {
          const { cart } = await medusa.store.cart.retrieve(this.medusaCartId)
          this.medusaCart = cart as unknown as MedusaCart
          return this.medusaCart
        } catch (error) {
          console.log('Existing cart not found, creating new one')
          this.medusaCartId = null
        }
      }

      // Create new cart if needed
      if (!this.medusaCartId) {
        const { cart } = await medusa.store.cart.create({
          region_id: MEDUSA_CONFIG.regionId,
          sales_channel_id: MEDUSA_CONFIG.salesChannelId,
        })
        
        this.medusaCart = cart as unknown as MedusaCart
        this.medusaCartId = this.medusaCart.id
        
        // Persist cart ID
        if (typeof window !== 'undefined') {
          localStorage.setItem('medusa_cart_id', this.medusaCartId)
        }
      }

      return this.medusaCart!
    } catch (error) {
      console.error('Failed to initialize cart:', error)
      throw error
    }
  }

  /**
   * Add item to both Zustand and Medusa carts
   */
  async addItem(product: Product, variantIdOrSize: string, quantity: number = 1) {
    try {
      // Ensure cart exists
      if (!this.medusaCartId) {
        await this.initialize()
      }

      let variantId = variantIdOrSize
      
      // Check if this is already a variant ID (contains "var" or looks like an ID)
      // Variant IDs can be like "var_xxx" or "variant_xxx" or just short IDs
      const isVariantId = variantIdOrSize.includes('var') || 
                          variantIdOrSize.includes('-') ||
                          variantIdOrSize.length > 10
      
      if (!isVariantId) {
        // It's a size name, try to find the variant
        const variant = await this.findVariantBySize(product.id, variantIdOrSize)
        if (!variant) {
          throw new Error(`Size ${variantIdOrSize} not available for this product`)
        }
        variantId = variant.id
      }

      // Add to Medusa cart using variant ID directly
      // SDK v2 uses createLineItem method
      const { cart: updatedCart } = await medusa.store.cart.createLineItem(
        this.medusaCartId!,
        {
          variant_id: variantId,
          quantity,
        }
      )

      this.medusaCart = updatedCart as unknown as MedusaCart

      // Also add to Zustand for immediate UI update
      const cartStore = useCartStore.getState()
      cartStore.addItem(product, variantIdOrSize, quantity)

      return this.medusaCart
    } catch (error) {
      console.error('Failed to add item:', error)
      throw error
    }
  }

  /**
   * Remove item from both carts
   */
  async removeItem(lineItemId: string, productId?: string, size?: string) {
    try {
      if (!this.medusaCartId) {
        throw new Error('No cart initialized')
      }

      // Remove from Medusa (SDK v2 method)
      const { cart: updatedCart, parent } = await medusa.store.cart.deleteLineItem(
        this.medusaCartId,
        lineItemId
      )

      this.medusaCart = updatedCart as unknown as MedusaCart

      // Remove from Zustand if product info provided
      if (productId && size) {
        const cartStore = useCartStore.getState()
        cartStore.removeItem(productId, size)
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to remove item:', error)
      throw error
    }
  }

  /**
   * Update item quantity
   */
  async updateQuantity(lineItemId: string, quantity: number, productId?: string, size?: string) {
    try {
      if (!this.medusaCartId) {
        throw new Error('No cart initialized')
      }

      // Update in Medusa (SDK v2 method)
      const { cart: updatedCart } = await medusa.store.cart.updateLineItem(
        this.medusaCartId,
        lineItemId,
        { quantity }
      )

      this.medusaCart = updatedCart as unknown as MedusaCart

      // Update in Zustand if product info provided
      if (productId && size) {
        const cartStore = useCartStore.getState()
        cartStore.updateQuantity(productId, size, quantity)
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to update quantity:', error)
      throw error
    }
  }

  /**
   * Sync Zustand cart to Medusa (for migration)
   */
  async syncFromZustand() {
    try {
      await this.initialize()
      
      const cartStore = useCartStore.getState()
      const zustandItems = cartStore.items

      // Clear Medusa cart first if it has items
      if (this.medusaCart?.items?.length) {
        for (const item of this.medusaCart.items) {
          await this.removeItem(item.id)
        }
      }

      // Add all Zustand items to Medusa
      for (const item of zustandItems) {
        try {
          // We need to get the actual product to find variant
          await this.addItem(
            { id: item.productId, name: item.name, price: item.price } as Product,
            item.size,
            item.quantity
          )
        } catch (error) {
          console.error(`Failed to sync item ${item.productId}:`, error)
        }
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to sync cart:', error)
      throw error
    }
  }

  /**
   * Find variant by size
   */
  private async findVariantBySize(productId: string, size: string) {
    try {
      const { product } = await medusa.store.product.retrieve(productId, {
        fields: "*variants",
      })

      // Find variant matching the size
      // Menswear sizes like "40R", "42L", etc.
      const variant = product.variants?.find((v: any) => 
        v.title === size || 
        v.options?.some((opt: any) => opt.value === size)
      )

      return variant
    } catch (error) {
      console.error('Failed to find variant:', error)
      return null
    }
  }

  /**
   * Get current cart
   */
  getCart() {
    return this.medusaCart
  }

  /**
   * Clear cart
   */
  async clearCart() {
    try {
      // Clear Medusa cart by removing all items
      if (this.medusaCart?.items?.length) {
        for (const item of this.medusaCart.items) {
          await this.removeItem(item.id)
        }
      }

      // Clear Zustand
      const cartStore = useCartStore.getState()
      cartStore.clearCart()

      return this.medusaCart
    } catch (error) {
      console.error('Failed to clear cart:', error)
      throw error
    }
  }

  /**
   * Add customer email to cart
   */
  async setCustomerEmail(email: string) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.update(this.medusaCartId, {
      email,
    })

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }

  /**
   * Add shipping address
   */
  async setShippingAddress(address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
  }) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.update(this.medusaCartId, {
      shipping_address: address,
    })

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }
}

// Singleton instance
export const cartAdapter = new CartAdapter()