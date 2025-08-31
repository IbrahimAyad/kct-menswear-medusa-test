'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  clientSecret: string
  cartId: string
  onSuccess: () => void
}

function PaymentForm({ clientSecret, cartId, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const card = elements.getElement(CardElement)
    if (!card) {
      setError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      // Confirm the payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
        }
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Complete the cart to create order
      const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        }
      })
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to complete cart')
      }
      
      const { order } = await completeResponse.json()
      
      if (order) {
        onSuccess()
      } else {
        setError('Failed to complete order')
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="p-4 border rounded-lg">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  )
}

export default function SimpleCheckoutPage() {
  const router = useRouter()
  const { medusaCart, isLoading } = useMedusaCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info')
  
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })
  
  // Generate a unique test email for guest checkout
  useEffect(() => {
    const timestamp = Date.now()
    setCustomerInfo(prev => ({
      ...prev,
      email: prev.email || `guest_${timestamp}@test.com`
    }))
  }, [])

  const handleCustomerInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!medusaCart?.id) {
        throw new Error('No cart available')
      }

      // Update cart with customer info
      // For guest checkout, we just set the email on the cart
      try {
        const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${medusaCart.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
          },
          body: JSON.stringify({
            email: customerInfo.email,
            billing_address: {
              first_name: customerInfo.firstName,
              last_name: customerInfo.lastName,
              address_1: '123 Test St',
              city: 'Test City',
              country_code: 'us',
              postal_code: '12345',
            },
            shipping_address: {
              first_name: customerInfo.firstName,
              last_name: customerInfo.lastName,
              address_1: '123 Test St',
              city: 'Test City',
              country_code: 'us',
              postal_code: '12345',
            }
          })
        })
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to update cart')
        }
      } catch (updateError: any) {
        // If email already exists, continue anyway - guest checkout allows this
        console.log('Cart update response:', updateError)
        if (!updateError?.message?.includes('already exists')) {
          throw updateError
        }
      }

      // Initialize payment session with Stripe
      console.log('Fetching payment providers for region:', medusaCart.region_id)
      
      const providersResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-providers?region_id=${medusaCart.region_id}`, {
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        }
      })
      
      if (!providersResponse.ok) {
        throw new Error('Failed to fetch payment providers')
      }
      
      const paymentProviders = await providersResponse.json()

      console.log('Payment providers response:', paymentProviders)
      console.log('Available providers:', paymentProviders?.payment_providers)

      // Look for Stripe provider - it should be pp_stripe_stripe based on backend config
      const stripeProvider = paymentProviders?.payment_providers?.find(
        p => p.id === 'pp_stripe_stripe' || 
             p.id.startsWith('pp_stripe_') || 
             p.id === 'stripe' || 
             p.id.includes('stripe')
      )

      console.log('Found Stripe provider:', stripeProvider)

      if (!stripeProvider) {
        // Log all available providers for debugging
        console.error('No Stripe provider found. Available providers:', 
          paymentProviders?.payment_providers?.map(p => p.id))
        throw new Error('Stripe payment provider not available. Available: ' + 
          (paymentProviders?.payment_providers?.map(p => p.id).join(', ') || 'none'))
      }

      // First, check if cart has a payment collection, if not create one
      console.log('Current cart payment collection:', medusaCart.payment_collection)
      
      let cartWithPaymentCollection = medusaCart
      
      // If no payment collection, create one first
      if (!medusaCart.payment_collection) {
        console.log('Creating payment collection for cart...')
        try {
          // Use direct API call instead of SDK method
          const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${medusaCart.id}/payment-collection`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
            }
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
          }
          
          const { cart } = await response.json()
          cartWithPaymentCollection = cart
          console.log('Payment collection created:', cart.payment_collection)
        } catch (collectionError: any) {
          console.error('Failed to create payment collection:', collectionError)
          throw new Error(`Failed to create payment collection: ${collectionError?.message || 'Unknown error'}`)
        }
      }
      
      // Initialize payment session with the correct provider ID
      console.log('Initializing payment session with provider:', stripeProvider.id)
      console.log('Cart ID:', cartWithPaymentCollection.id)
      console.log('Payment collection ID:', cartWithPaymentCollection.payment_collection?.id)
      
      // Make sure we have a payment collection ID
      if (!cartWithPaymentCollection.payment_collection?.id) {
        throw new Error('Payment collection was not created properly')
      }
      
      let paymentCollection
      try {
        // Initialize payment session using REST API
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections/${cartWithPaymentCollection.payment_collection.id}/payment-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
          },
          body: JSON.stringify({
            provider_id: stripeProvider.id,
            data: {},
            context: {
              cart_id: cartWithPaymentCollection.id
            }
          })
        })
        
        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to initialize payment session')
        }
        
        const response = await sessionResponse.json()
        paymentCollection = response.payment_collection
        console.log('Payment session response:', response)
      } catch (paymentError: any) {
        console.error('Payment session initialization failed:', paymentError)
        throw new Error(`Failed to initialize payment: ${paymentError?.message || 'Unable to connect to payment service'}`)
      }

      // Get client secret from payment session
      const paymentSession = paymentCollection?.payment_sessions?.find(
        (session: any) => session.provider_id === stripeProvider.id
      )
      
      console.log('Payment session data:', paymentSession)
      
      if (paymentSession?.data?.client_secret) {
        setClientSecret(paymentSession.data.client_secret as string)
        setStep('payment')
      } else if (paymentSession?.payment_intent_client_secret) {
        // Sometimes the client secret is directly on the session
        setClientSecret(paymentSession.payment_intent_client_secret as string)
        setStep('payment')
      } else {
        console.error('No client secret in payment session:', paymentSession)
        throw new Error('Payment session created but no client secret received')
      }
    } catch (err: any) {
      console.error('Setup error:', err)
      setError(err?.message || 'Failed to setup payment')
    }
  }

  const handlePaymentSuccess = () => {
    setStep('success')
    // Clear cart
    localStorage.removeItem('medusa_cart_id')
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

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Complete!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase.</p>
          <Link 
            href="/products-test"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
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

        <h1 className="text-3xl font-bold mb-8">Simple Checkout</h1>

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
                    ${((item.unit_price || 0) * item.quantity).toFixed(2)}
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

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'info' ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCustomerInfo} className="space-y-4">
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

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </h2>
                
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm 
                      clientSecret={clientSecret}
                      cartId={medusaCart.id}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}