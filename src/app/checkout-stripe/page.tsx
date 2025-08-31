'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { medusa } from '@/lib/medusa/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Lock, CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

interface PaymentFormProps {
  clientSecret: string
  cartId: string
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
}

function PaymentForm({ clientSecret, cartId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setPaymentError('Stripe is not loaded properly. Please refresh and try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh and try again.')
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        console.error('Stripe payment error:', stripeError)
        setPaymentError(stripeError.message || 'Payment failed. Please try again.')
        onError(stripeError.message || 'Payment failed')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Complete the order in Medusa
        try {
          const completeResponse = await medusa.store.cart.complete(cartId)
          console.log('Order completed successfully:', completeResponse)
          
          if (completeResponse?.order?.id) {
            onSuccess(completeResponse.order.id)
          } else {
            throw new Error('Order completion failed - no order ID returned')
          }
        } catch (medusaError) {
          console.error('Medusa order completion error:', medusaError)
          setPaymentError('Payment succeeded but order completion failed. Please contact support.')
          onError('Order completion failed')
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setPaymentError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
        </div>
        
        <div className="bg-white p-4 rounded-md border">
          <CardElement options={cardElementOptions} />
        </div>
        
        {paymentError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{paymentError}</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            Complete Payment
          </>
        )}
      </button>

      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Your payment is secured by Stripe</span>
        </div>
      </div>
    </form>
  )
}

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  country: string
}

export default function StripeCheckoutPage() {
  const router = useRouter()
  const { medusaCart, isLoading } = useMedusaCart()
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    country: 'us'
  })

  // Available payment providers (for demo - in real app this would be fetched)
  const [paymentProviders, setPaymentProviders] = useState<string[]>(['stripe'])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsInitiatingPayment(true)

    if (!medusaCart?.id) {
      setError('No cart found. Please add items to your cart first.')
      setIsInitiatingPayment(false)
      return
    }

    try {
      // Step 1: Update cart with customer info
      await medusa.store.cart.update(medusaCart.id, {
        email: formData.email,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          province: formData.state,
          postal_code: formData.zipCode,
          country_code: formData.country,
          phone: formData.phone,
        },
        billing_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          province: formData.state,
          postal_code: formData.zipCode,
          country_code: formData.country,
        }
      })

      // Step 2: Get available shipping options
      const shippingOptions = await medusa.store.shipping.listCartOptions(medusaCart.id)
      
      if (shippingOptions.length > 0) {
        // Add first available shipping option
        await medusa.store.cart.addShippingMethod(medusaCart.id, {
          option_id: shippingOptions[0].id,
        })
      }

      // Step 3: List available payment providers
      const providers = await medusa.store.payment.listPaymentProviders()
      console.log('Available payment providers:', providers)
      setPaymentProviders(providers.map((p: any) => p.id))

      // Step 4: Initialize payment session with Stripe
      if (providers.some((p: any) => p.id === 'stripe')) {
        const paymentCollection = await medusa.store.payment.initiatePaymentSession(
          medusaCart.id,
          {
            provider_id: 'stripe'
          }
        )

        console.log('Payment session initialized:', paymentCollection)

        // Extract client secret from payment session
        const stripeSession = paymentCollection.payment_sessions?.find(
          (session: any) => session.provider_id === 'stripe'
        )

        if (stripeSession?.data?.client_secret) {
          setClientSecret(stripeSession.data.client_secret)
          setPaymentSessionId(stripeSession.id)
          setStep('payment')
        } else {
          throw new Error('Failed to initialize Stripe payment session - no client secret received')
        }
      } else {
        throw new Error('Stripe payment provider not available')
      }
    } catch (err) {
      console.error('Error setting up payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to set up payment. Please try again.')
    } finally {
      setIsInitiatingPayment(false)
    }
  }

  const handlePaymentSuccess = (newOrderId: string) => {
    setOrderId(newOrderId)
    setStep('success')
    
    // Clear cart from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medusa_cart_id')
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Calculate totals
  const subtotal = medusaCart?.subtotal || 0
  const shippingTotal = medusaCart?.shipping_total || 0
  const taxTotal = medusaCart?.tax_total || 0
  const total = medusaCart?.total || 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-lg">Loading checkout...</div>
        </div>
      </div>
    )
  }

  if (!medusaCart || !medusaCart.items?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              Order ID: {orderId}
            </p>
          )}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/orders')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Orders
            </button>
            <Link 
              href="/products"
              className="block w-full text-blue-600 py-2 px-6 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'shipping' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'shipping' ? '1' : <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="font-medium">Shipping</span>
            </div>
            <div className="w-12 h-px bg-gray-300" />
            <div className={`flex items-center gap-2 ${
              step === 'payment' ? 'text-blue-600' : step === 'success' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-blue-600 text-white' : 
                step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step === 'success' ? <CheckCircle className="w-4 h-4" /> : '2'}
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        required
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isInitiatingPayment}
                    className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isInitiatingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Setting up payment...
                      </>
                    ) : (
                      'Continue to Payment'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && clientSecret && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <Elements stripe={stripePromise}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    cartId={medusaCart.id}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {medusaCart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.variant?.product?.title || item.title || 'Product'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Size: {item.variant?.title || 'N/A'} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        ${((item.unit_price || 0) * item.quantity / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${(shippingTotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${(taxTotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}