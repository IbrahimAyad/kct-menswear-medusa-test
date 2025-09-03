'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { isCoreProductId } from '@/lib/config/product-routing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CoreCartItem {
  id: string // Product ID like 'suit-navy-2p'
  name: string
  price: number // Price in dollars
  quantity: number
  size?: string
  color?: string
  stripePriceId?: string
  image?: string
  type?: string // '2p' or '3p' for suits
}

interface CoreCartContextType {
  items: CoreCartItem[]
  addItem: (item: CoreCartItem) => void
  removeItem: (id: string, size?: string) => void
  updateQuantity: (id: string, quantity: number, size?: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  checkoutWithStripe: () => Promise<void>
  isLoading: boolean
}

const CoreCartContext = createContext<CoreCartContextType | undefined>(undefined)

export function CoreCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CoreCartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('core-cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        // Only load core products
        const coreItems = parsed.filter((item: CoreCartItem) => isCoreProductId(item.id))
        setItems(coreItems)
      } catch (error) {
        console.error('Failed to load core cart:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('core-cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: CoreCartItem) => {
    // Only accept core products
    if (!isCoreProductId(newItem.id)) {
      console.warn('Attempted to add non-core product to core cart:', newItem.id)
      return
    }

    setItems(prevItems => {
      // Check if item already exists (same ID and size)
      const existingIndex = prevItems.findIndex(
        item => item.id === newItem.id && item.size === newItem.size
      )

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prevItems]
        updated[existingIndex].quantity += newItem.quantity
        return updated
      } else {
        // Add new item
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (id: string, size?: string) => {
    setItems(prevItems => 
      prevItems.filter(item => !(item.id === id && item.size === size))
    )
  }

  const updateQuantity = (id: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(id, size)
      return
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id && item.size === size 
          ? { ...item, quantity } 
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem('core-cart')
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const checkoutWithStripe = async () => {
    if (items.length === 0) return

    setIsLoading(true)
    try {
      // Create line items for Stripe
      const lineItems = items.map(item => ({
        price: item.stripePriceId, // Use the Stripe price ID if available
        quantity: item.quantity,
        // If no price ID, use price_data
        ...((!item.stripePriceId) && {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: `Size: ${item.size || 'Standard'}`,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents for Stripe
          }
        })
      }))

      // Call API to create Stripe checkout session
      const response = await fetch('/api/checkout/core-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: lineItems,
          // Include cart items for reference
          cartItems: items,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url, sessionId } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else if (sessionId) {
        const stripe = await stripePromise
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CoreCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        checkoutWithStripe,
        isLoading,
      }}
    >
      {children}
    </CoreCartContext.Provider>
  )
}

export function useCoreCart() {
  const context = useContext(CoreCartContext)
  if (!context) {
    throw new Error('useCoreCart must be used within CoreCartProvider')
  }
  return context
}