import { useState, useEffect, useCallback } from 'react'
import { cartAdapter } from '@/lib/medusa/cart-adapter'
import { useCartStore } from '@/lib/store/cartStore'
import { Product } from '@/lib/types'

export function useMedusaCart() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medusaCart, setMedusaCart] = useState<any>(null)

  // Get Zustand store
  const zustandCart = useCartStore()

  // Initialize Medusa cart on mount
  useEffect(() => {
    const initCart = async () => {
      try {
        setIsLoading(true)
        const cart = await cartAdapter.initialize()
        setMedusaCart(cart)
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize cart')
      } finally {
        setIsLoading(false)
      }
    }

    initCart()
  }, [])

  // Add item to cart
  const addItem = useCallback(async (product: Product, size: string, quantity: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.addItem(product, size, quantity)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add item'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remove item from cart
  const removeItem = useCallback(async (lineItemId: string, productId?: string, size?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.removeItem(lineItemId, productId, size)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove item'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update quantity
  const updateQuantity = useCallback(async (
    lineItemId: string, 
    quantity: number, 
    productId?: string, 
    size?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.updateQuantity(lineItemId, quantity, productId, size)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update quantity'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.clearCart()
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync from Zustand to Medusa
  const syncFromZustand = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.syncFromZustand()
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync cart'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh cart from server
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true)
      const cart = await cartAdapter.initialize()
      setMedusaCart(cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cart')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isInitialized,
    isLoading,
    error,
    medusaCart,
    zustandCart: zustandCart.items,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncFromZustand,
    refreshCart,
    
    // Cart info
    itemCount: medusaCart?.items?.length || 0,
    subtotal: medusaCart?.subtotal || 0,
    total: medusaCart?.total || 0,
  }
}