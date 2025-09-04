'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  createMedusaCart, 
  addToMedusaCart, 
  updateMedusaCartItem,
  removeFromMedusaCart,
  getMedusaCart,
  type MedusaCart as MedusaCartType,
  type MedusaProduct
} from '@/services/medusaBackendService'

interface MedusaCartContextType {
  cart: MedusaCartType | null
  cartId: string | null
  isLoading: boolean
  error: string | null
  
  // Cart operations
  initializeCart: (email?: string) => Promise<void>
  addItem: (variantId: string, quantity?: number, product?: MedusaProduct) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
  
  // Helpers
  getItemCount: () => number
  getSubtotal: () => number
}

const MedusaCartContext = createContext<MedusaCartContextType | undefined>(undefined)

export function MedusaCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<MedusaCartType | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem('medusa_cart_id')
    if (savedCartId) {
      setCartId(savedCartId)
      refreshCartById(savedCartId)
    }
  }, [])

  // Save cart ID to localStorage when it changes
  useEffect(() => {
    if (cartId) {
      localStorage.setItem('medusa_cart_id', cartId)
    } else {
      localStorage.removeItem('medusa_cart_id')
    }
  }, [cartId])

  const refreshCartById = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const cartData = await getMedusaCart(id)
      if (cartData) {
        setCart(cartData)
      } else {
        // Cart might be expired or invalid
        console.log('Cart not found, clearing stored ID')
        localStorage.removeItem('medusa_cart_id')
        setCartId(null)
        setCart(null)
      }
    } catch (err) {
      console.error('Failed to refresh cart, creating new one:', err)
      // Clear invalid cart ID and reset state
      localStorage.removeItem('medusa_cart_id')
      setCartId(null)
      setCart(null)
      setError(null) // Don't show error for expired carts
    } finally {
      setIsLoading(false)
    }
  }

  const initializeCart = async (email?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const newCart = await createMedusaCart(email)
      if (newCart) {
        setCart(newCart)
        setCartId(newCart.cart_id || newCart.id)
      } else {
        throw new Error('Failed to create cart')
      }
    } catch (err: any) {
      console.error('Failed to initialize cart:', err)
      setError(err.message || 'Failed to create cart')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (variantId: string, quantity: number = 1, product?: MedusaProduct) => {
    try {
      setIsLoading(true)
      setError(null)
      
      let currentCartId = cartId
      
      // Create cart if it doesn't exist
      if (!currentCartId) {
        const newCart = await createMedusaCart()
        if (newCart) {
          currentCartId = newCart.cart_id || newCart.id
          setCartId(currentCartId)
          setCart(newCart)
        } else {
          throw new Error('Failed to create cart')
        }
      }
      
      // Add item to cart
      const updatedCart = await addToMedusaCart(currentCartId, variantId, quantity)
      if (updatedCart) {
        setCart(updatedCart)
      } else {
        throw new Error('Failed to add item to cart')
      }
      
      // Show success toast/notification (could emit event here)
      console.log('Item added to cart successfully')
      
    } catch (err: any) {
      console.error('Failed to add item:', err)
      setError(err.message || 'Failed to add item to cart')
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cartId) {
      setError('No cart found')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }
      
      const updatedCart = await updateMedusaCartItem(cartId, itemId, quantity)
      if (updatedCart) {
        setCart(updatedCart)
      }
    } catch (err: any) {
      console.error('Failed to update quantity:', err)
      setError(err.message || 'Failed to update quantity')
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!cartId) {
      setError('No cart found')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await removeFromMedusaCart(cartId, itemId)
      if (updatedCart) {
        setCart(updatedCart)
      }
    } catch (err: any) {
      console.error('Failed to remove item:', err)
      setError(err.message || 'Failed to remove item')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    setCart(null)
    setCartId(null)
    setError(null)
    localStorage.removeItem('medusa_cart_id')
  }

  const refreshCart = async () => {
    if (cartId) {
      await refreshCartById(cartId)
    }
  }

  const getItemCount = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getSubtotal = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => {
      return total + (item.unit_price * item.quantity)
    }, 0)
  }

  return (
    <MedusaCartContext.Provider
      value={{
        cart,
        cartId,
        isLoading,
        error,
        initializeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        getItemCount,
        getSubtotal
      }}
    >
      {children}
    </MedusaCartContext.Provider>
  )
}

export function useMedusaCart() {
  const context = useContext(MedusaCartContext)
  if (!context) {
    throw new Error('useMedusaCart must be used within MedusaCartProvider')
  }
  return context
}