'use client'

import { useState, useEffect } from 'react'
import { medusa } from '@/lib/medusa/client'

export default function TestMedusaProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    initializeCart()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Fetch products from Medusa backend
      const response = await medusa.store.product.list({
        limit: 10,
        fields: "*variants,*variants.prices"
      })
      
      console.log('Medusa products response:', response)
      setProducts(response.products || [])
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const initializeCart = async () => {
    try {
      // Check if cart ID exists in localStorage
      const existingCartId = localStorage.getItem('medusa_cart_id')
      
      if (existingCartId) {
        // Try to retrieve existing cart
        try {
          const { cart } = await medusa.store.cart.retrieve(existingCartId)
          setCartId(cart.id)
          console.log('Retrieved existing cart:', cart)
          return
        } catch (err) {
          console.log('Existing cart not found, creating new one')
          localStorage.removeItem('medusa_cart_id')
        }
      }

      // Create new cart
      const { cart } = await medusa.store.cart.create({
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
        sales_channel_id: process.env.NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID
      })
      
      setCartId(cart.id)
      localStorage.setItem('medusa_cart_id', cart.id)
      console.log('Created new cart:', cart)
    } catch (err: any) {
      console.error('Error initializing cart:', err)
      setError(err?.message || 'Failed to initialize cart')
    }
  }

  const addToCart = async (variantId: string) => {
    if (!cartId) {
      alert('Cart not initialized')
      return
    }

    try {
      const { cart } = await medusa.store.cart.createLineItem(cartId, {
        variant_id: variantId,
        quantity: 1
      })
      
      console.log('Item added to cart:', cart)
      alert('Added to cart successfully!')
    } catch (err: any) {
      console.error('Error adding to cart:', err)
      alert(`Failed to add to cart: ${err?.message}`)
    }
  }

  if (loading) return <div className="p-8">Loading products...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Medusa Products Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}</p>
        <p><strong>Cart ID:</strong> {cartId || 'Not initialized'}</p>
        <p><strong>Products Found:</strong> {products.length}</p>
      </div>

      {products.length === 0 ? (
        <div className="p-4 bg-yellow-100 rounded">
          <p>No products found in Medusa backend.</p>
          <p className="mt-2 text-sm">Make sure products are created in the admin panel.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-2">ID: {product.id}</p>
              
              {product.variants && product.variants.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Variants:</p>
                  <div className="grid gap-2">
                    {product.variants.map((variant: any) => (
                      <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="text-sm">{variant.title}</span>
                          {variant.prices && variant.prices[0] && (
                            <span className="ml-2 text-sm text-gray-600">
                              ${(variant.prices[0].amount / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(variant.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No variants available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}