import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('Payment succeeded:', paymentIntent.id)
      
      // Create order in Medusa backend
      try {
        const cartId = paymentIntent.metadata.cartId
        const email = paymentIntent.metadata.email
        
        if (cartId) {
          // Try to complete cart in Medusa
          const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'
          const medusaKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
          
          const response = await fetch(`${medusaUrl}/store/carts/${cartId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': medusaKey!,
            },
            body: JSON.stringify({})
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Order created in Medusa:', data)
          } else {
            console.error('Failed to create order in Medusa')
            
            // Fallback: Create order directly in database
            // This would require database access
            console.log('Would create order in database:', {
              payment_intent_id: paymentIntent.id,
              cart_id: cartId,
              amount: paymentIntent.amount,
              email: email,
              status: 'paid'
            })
          }
        }
      } catch (error) {
        console.error('Error creating order:', error)
      }
      break

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', failedIntent.id)
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
