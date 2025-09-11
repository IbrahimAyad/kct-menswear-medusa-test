'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

// Use the correct Stripe publishable key
const STRIPE_PK = 'pk_live_51RAMT2CHc12x7sCzv9MxCfz8HBj76Js5MiRCa0F0o3xVOJJ0LS7pRNhDxIJZf5mQQBW6vD5h3cQzI0B5vhLSl6Y200YY9iXR7h'

console.log('Loading Stripe with publishable key:', STRIPE_PK.substring(0, 20) + '...')

// Load Stripe with explicit configuration
const stripePromise = loadStripe(STRIPE_PK, {
  // Ensure we're not loading any beta features
  betas: [],
  // Set locale explicitly
  locale: 'en'
}).then(stripe => {
  console.log('Stripe loaded:', !!stripe)
  if (!stripe) {
    console.error('Failed to load Stripe')
  }
  return stripe
}).catch(error => {
  console.error('Error loading Stripe:', error)
  return null
})

interface StripeCheckoutProps {
  amount: number
  cartId: string
  email?: string
  onSuccess: () => void
}

function PaymentForm({ amount, cartId, onSuccess }: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?cart_id=${cartId}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // If we get here without redirect, payment succeeded
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-h-[250px]">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="pt-2">
        <div className="text-center text-sm text-gray-600 mb-3">
          Total: ${(amount / 100).toFixed(2)}
        </div>
        
        <Button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripeCheckout({ amount, cartId, email, onSuccess }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    console.log('Creating payment intent for:', { amount, cartId, email })
    
    // Create payment intent using our CLEAN API route (no Amazon Pay params)
    fetch('/api/checkout/stripe-clean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        cartId,
        email,
      }),
    })
      .then(res => {
        console.log('API Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('API Response data:', data)
        
        if (data.error) {
          console.error('API Error:', data.error)
          console.error('Debug info:', data.debug)
          setDebugInfo(data.debug)
          throw new Error(data.error)
        }
        
        if (!data.clientSecret) {
          console.error('No client secret received')
          throw new Error('No client secret received from server')
        }
        
        console.log('Client secret received:', data.clientSecret.substring(0, 20) + '...')
        console.log('Debug info:', data.debug)
        setClientSecret(data.clientSecret)
      })
      .catch(err => {
        console.error('Payment initialization error:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [amount, cartId, email])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Payment initialization failed</p>
        <p className="text-sm mt-1">{error}</p>
        {debugInfo && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
            <p>Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        <p>Unable to initialize payment. Please try again.</p>
        <p className="text-xs mt-2">If this persists, check browser console for errors.</p>
      </div>
    )
  }

  console.log('Rendering Elements with client secret:', clientSecret.substring(0, 20) + '...')
  
  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
          },
        },
        loader: 'auto',
      }}
    >
      <PaymentForm 
        amount={amount} 
        cartId={cartId} 
        onSuccess={onSuccess} 
      />
    </Elements>
  )
}