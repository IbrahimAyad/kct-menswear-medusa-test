'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreditCard, AlertCircle, ChevronRight, ShoppingBag, Truck } from 'lucide-react'
import { medusa } from '@/lib/medusa/client'

// Initialize Stripe - ensure this runs only on client
const stripePromise = typeof window !== 'undefined' 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null

// Payment Form Component
function PaymentForm({ clientSecret, cartId }: { clientSecret: string, cartId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?cart_id=${cartId}`,
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
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
  const { medusaCart, isLoading, refreshCart } = useMedusaCart()
  const [mounted, setMounted] = useState(false)
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
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>('')

  // Ensure component is mounted before showing dynamic content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize cart region if needed
  useEffect(() => {
    if (!mounted || !medusaCart?.id) return

    const ensureCartReady = async () => {
      try {
        // Check if cart needs region
        if (!medusaCart.region_id) {
          console.log('Cart missing region, setting default...')
          
          // Use the configured region from environment
          const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
          if (regionId) {
            await medusa.store.cart.update(medusaCart.id, {
              region_id: regionId
            })
            await refreshCart()
          }
        }

        // Ensure cart has email if user provided one
        const savedEmail = localStorage.getItem('checkout_email')
        if (savedEmail && !medusaCart.email) {
          await medusa.store.cart.update(medusaCart.id, {
            email: savedEmail
          })
        }
      } catch (err) {
        console.error('Error preparing cart:', err)
      }
    }

    ensureCartReady()
  }, [mounted, medusaCart?.id])

  const initializePayment = useCallback(async () => {
    if (!medusaCart?.id) {
      setError('No cart available')
      return
    }

    // Validate required fields
    if (!customerInfo.email) {
      setError('Please provide your email address')
      return
    }

    setIsInitializing(true)
    setError(null)

    try {
      // Save email for future use
      localStorage.setItem('checkout_email', customerInfo.email)

      // Step 1: Update cart with customer information and ensure region
      console.log('Updating cart with customer info...')
      const updateData: any = {
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
          country_code: 'us'
        }
      }

      // Ensure region is set
      if (!medusaCart.region_id) {
        updateData.region_id = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
      }

      await medusa.store.cart.update(medusaCart.id, updateData)
      
      // Refresh cart to get updated data
      await refreshCart()

      // Step 2: Use direct Stripe checkout (simpler and more reliable)
      console.log('Creating Stripe checkout session...')
      const checkoutResponse = await fetch('/api/checkout/stripe-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: medusaCart.id,
          email: customerInfo.email
        })
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url, sessionId } = await checkoutResponse.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else if (sessionId && stripePromise) {
        const stripe = await stripePromise
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      } else {
        throw new Error('No checkout URL or session ID received')
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err)
      setError(err?.message || 'Failed to initialize payment. Please try again.')
    } finally {
      setIsInitializing(false)
    }
  }, [medusaCart?.id, customerInfo, refreshCart])

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    initializePayment()
  }

  // Don't render dynamic content until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
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

  const subtotal = medusaCart.subtotal || 0
  const tax = medusaCart.tax_total || 0
  const shipping = medusaCart.shipping_total || 0
  const total = medusaCart.total || subtotal + tax + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'info' ? (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
                
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.state}
                        onChange={(e) => setCustomerInfo({...customerInfo, state: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={customerInfo.postalCode}
                        onChange={(e) => setCustomerInfo({...customerInfo, postalCode: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="90210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isInitializing}
                    className="w-full py-3 bg-black text-white hover:bg-gray-800"
                  >
                    {isInitializing ? (
                      'Processing...'
                    ) : (
                      <>
                        Continue to Payment
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm clientSecret={clientSecret} cartId={medusaCart.id} />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
                    <p className="mt-4">Initializing payment...</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {medusaCart.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-600">
                        {item.variant?.title && `Size: ${item.variant.title}`} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">${(item.total).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(subtotal).toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${(shipping).toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(tax).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${(total).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}