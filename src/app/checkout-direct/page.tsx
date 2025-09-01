'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useMedusaAuth } from '@/contexts/MedusaAuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export default function DirectCheckoutPage() {
  const router = useRouter()
  const { medusaCart, isLoading } = useMedusaCart()
  const { user } = useMedusaAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })
  
  // Use logged-in user's email if available
  useEffect(() => {
    if (user?.email) {
      setCustomerInfo(prev => ({
        ...prev,
        email: user.email
      }))
    }
  }, [user])

  const handleDirectCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)
    
    try {
      if (!medusaCart?.id) {
        throw new Error('No cart available')
      }

      // Update cart with customer info (simple approach)
      try {
        const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${medusaCart.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
          },
          body: JSON.stringify({
            email: customerInfo.email
          })
        })
        
        if (!updateResponse.ok) {
          console.log('Cart update failed but continuing...')
        }
      } catch (err) {
        console.log('Cart update error, continuing anyway:', err)
      }

      // Create a simple Stripe checkout session directly
      // This bypasses Medusa's payment system entirely
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe not loaded')
      }

      // For now, we'll create a simple payment intent client-side
      // In production, this should be done server-side
      alert(`
        Checkout would proceed with:
        - Email: ${customerInfo.email}
        - Name: ${customerInfo.firstName} ${customerInfo.lastName}
        - Total: $${((medusaCart.total || 0) / 100).toFixed(2)}
        
        Note: Direct Stripe integration needed here.
        The Medusa payment system is not working properly.
      `)
      
      // After successful payment, complete the cart
      // const { order } = await medusa.store.cart.complete(medusaCart.id)
      
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err?.message || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading checkout...</div>
      </div>
    )
  }

  if (!medusaCart || !medusaCart.items?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">Your cart is empty</h1>
        <Link href="/products-test" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/products-test" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <h1 className="text-3xl font-bold mb-8">Direct Checkout (Simplified)</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {medusaCart.items.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {item.variant?.product?.title || item.title || 'Product'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${((item.unit_price || 0) * item.quantity / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${((medusaCart.total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Simplified Checkout Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleDirectCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a simplified checkout that bypasses Medusa's payment system. 
                  In production, you would integrate Stripe directly here or fix the Medusa backend configuration.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Why this simplified checkout?</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Medusa payment collection API works ✅</li>
            <li>• Medusa payment session initialization fails (500 error) ❌</li>
            <li>• This suggests backend Stripe configuration issues</li>
            <li>• Direct Stripe integration would bypass these issues</li>
          </ul>
        </div>
      </div>
    </div>
  )
}