'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ArrowLeft, CreditCard, AlertCircle, Truck } from 'lucide-react'
import Link from 'next/link'
import { medusa } from '@/lib/medusa/client'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Payment Form Component
function CheckoutForm({ clientSecret, cartId }: { clientSecret: string, cartId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    // Use a constant URL to avoid hydration issues
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'https://kct-minimax-test.vercel.app')

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${baseUrl}/checkout/success?cart_id=${cartId}`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          'Processing...'
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </>
        )}
      </button>
    </form>
  )
}

export default function StripeCheckoutPage() {
  const router = useRouter()
  const { medusaCart, isLoading } = useMedusaCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  })
  const [step, setStep] = useState<'info' | 'payment'>('info')

  const initializePayment = async () => {
    if (!medusaCart?.id) {
      setError('No cart available')
      return
    }

    setIsInitializing(true)
    setError(null)

    try {
      // Step 1: Update cart with customer information
      console.log('Updating cart with customer info...')
      await medusa.store.cart.update(medusaCart.id, {
        email: customerInfo.email,
        shipping_address: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          address_1: customerInfo.address,
          city: customerInfo.city,
          province: customerInfo.state,
          postal_code: customerInfo.postalCode,
          country_code: 'us',
          phone: customerInfo.phone
        },
        billing_address: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          address_1: customerInfo.address,
          city: customerInfo.city,
          province: customerInfo.state,
          postal_code: customerInfo.postalCode,
          country_code: 'us',
          phone: customerInfo.phone
        }
      })

      // Step 1.5: Add shipping method (required for payment)
      console.log('Getting shipping options...')
      const shippingOptions = await medusa.store.fulfillment.listCartOptions({ 
        cart_id: medusaCart.id 
      })
      
      if (shippingOptions.shipping_options?.length > 0) {
        console.log('Adding shipping method:', shippingOptions.shipping_options[0].id)
        await medusa.store.cart.addShippingMethod(medusaCart.id, {
          option_id: shippingOptions.shipping_options[0].id
        })
      }

      // Step 2: Create payment collection (Medusa 2.0 API)
      console.log('Creating payment collection for cart:', medusaCart.id)
      const paymentCollectionResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        },
        body: JSON.stringify({
          cart_id: medusaCart.id,
          region_id: medusaCart.region_id // Add region_id for Medusa 2.0
        })
      })

      if (!paymentCollectionResponse.ok) {
        const errorData = await paymentCollectionResponse.json()
        console.error('Payment collection error:', errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to create payment collection')
      }

      const paymentCollection = await paymentCollectionResponse.json()

      // Step 3: Initialize Stripe payment session
      const collectionId = paymentCollection.payment_collection?.id || paymentCollection.id
      console.log('Payment collection created:', collectionId)
      console.log('Initializing payment session with provider: stripe')
      
      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections/${collectionId}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        },
        body: JSON.stringify({
          provider_id: 'stripe'
        })
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        console.error('Payment session error:', errorData)
        console.error('Status:', sessionResponse.status)
        throw new Error(errorData.message || errorData.error || 'Failed to create payment session')
      }

      const sessionData = await sessionResponse.json()
      console.log('Payment session response:', sessionData)
      
      // Get client secret from payment session - handle different response formats
      let stripeClientSecret = null
      
      // Try different paths where client_secret might be
      if (sessionData.payment_collection?.payment_sessions?.[0]?.data?.client_secret) {
        stripeClientSecret = sessionData.payment_collection.payment_sessions[0].data.client_secret
      } else if (sessionData.payment_sessions?.[0]?.data?.client_secret) {
        stripeClientSecret = sessionData.payment_sessions[0].data.client_secret
      } else if (sessionData.data?.client_secret) {
        stripeClientSecret = sessionData.data.client_secret
      } else if (sessionData.client_secret) {
        stripeClientSecret = sessionData.client_secret
      }

      if (!stripeClientSecret) {
        console.error('No client secret found in response:', sessionData)
        throw new Error('Payment initialization failed - no client secret received')
      }

      setClientSecret(stripeClientSecret)
      setStep('payment')
    } catch (err: any) {
      console.error('Payment initialization error:', err)
      setError(err?.message || 'Failed to initialize payment')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    initializePayment()
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
        <Link href="/kct-shop" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold mb-8">Secure Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <button
                onClick={async () => {
                  await clearCart()
                  window.location.reload()
                }}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Clear Cart
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {medusaCart.items.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {item.title || item.variant?.product?.title || 'Product'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.variant?.title && `Size: ${item.variant.title}`}
                      {item.quantity > 1 && ` • Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${((item.unit_price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${(medusaCart.subtotal || 0).toFixed(2)}</span>
              </div>
              
              {medusaCart.tax_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${(medusaCart.tax_total || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {medusaCart.shipping_total === 0 ? 'FREE' : `$${medusaCart.shipping_total.toFixed(2)}`}
                </span>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span>${(medusaCart.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-green-50 rounded text-sm">
              <p className="font-medium text-green-900">✓ Secure Payment</p>
              <p className="text-green-700">Powered by Stripe</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'info' ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={customerInfo.state}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="CA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.postalCode}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isInitializing}
                    className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isInitializing ? 'Initializing Payment...' : 'Continue to Payment'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                    <CheckoutForm clientSecret={clientSecret} cartId={medusaCart.id} />
                  </Elements>
                )}
              </>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 justify-center mt-6">
              <Truck className="h-4 w-4" />
              <span>Free shipping on orders over $100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}