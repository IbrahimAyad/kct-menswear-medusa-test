'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'
const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

interface CartItem {
  id: string
  variant_id: string
  quantity: number
  title: string
  thumbnail?: string
  unit_price: number
}

interface Cart {
  id: string
  items: CartItem[]
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
}

interface MedusaCartContextType {
  cart: Cart | null
  isLoading: boolean
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  error: string | null
}

const MedusaCartContext = createContext<MedusaCartContextType | undefined>(undefined)

export function MedusaCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize cart on mount
  useEffect(() => {
    initializeCart()
  }, [])

  const initializeCart = async () => {
    const cartId = localStorage.getItem('medusa_cart_id')
    
    if (cartId) {
      // Try to retrieve existing cart
      try {
        const response = await fetch(`${API_URL}/store/carts/${cartId}`, {
          headers: {
            'x-publishable-api-key': PUBLISHABLE_KEY
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setCart(data.cart)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to retrieve cart:', err)
      }
    }
    
    // Create new cart
    await createCart()
  }

  const createCart = async () => {
    try {
      const response = await fetch(`${API_URL}/store/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          region_id: REGION_ID
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create cart')
      }

      const data = await response.json()
      setCart(data.cart)
      localStorage.setItem('medusa_cart_id', data.cart.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (variantId: string, quantity: number = 1) => {
    if (!cart) return
    
    setError(null)
    try {
      const response = await fetch(`${API_URL}/store/carts/${cart.id}/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      const data = await response.json()
      setCart(data.cart)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateQuantity = async (lineItemId: string, quantity: number) => {
    if (!cart) return
    
    setError(null)
    try {
      const response = await fetch(`${API_URL}/store/carts/${cart.id}/line-items/${lineItemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          quantity
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update quantity')
      }

      const data = await response.json()
      setCart(data.cart)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const removeItem = async (lineItemId: string) => {
    if (!cart) return
    
    setError(null)
    try {
      const response = await fetch(`${API_URL}/store/carts/${cart.id}/line-items/${lineItemId}`, {
        method: 'DELETE',
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      const data = await response.json()
      setCart(data.cart)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const clearCart = async () => {
    localStorage.removeItem('medusa_cart_id')
    setCart(null)
    await createCart()
  }

  return (
    <MedusaCartContext.Provider
      value={{
        cart,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        error
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