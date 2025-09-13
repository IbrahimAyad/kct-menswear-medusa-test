import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if webhook is configured (optional for frontend-only deployment)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - Stripe webhooks will not work')
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set - Stripe webhooks will not work')
}

// Only initialize if keys are available
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Return early if Stripe is not configured
  if (!stripe || !webhookSecret) {
    console.warn('Stripe webhook received but not configured properly')
    return NextResponse.json({ 
      error: 'Stripe webhook not configured' 
    }, { status: 503 })
  }

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
  console.log(`Processing event: ${event.type}`)
  
  try {
    switch (event.type) {
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge
        
        console.log('Charge succeeded:', charge.id)
        console.log('Charge metadata:', charge.metadata)
        
        // Extract metadata from charge (charges inherit metadata from payment intent)
        const cartIdFromCharge = charge.metadata.cartId || charge.metadata.cart_id
        const emailFromCharge = charge.metadata.email
        
        if (cartIdFromCharge) {
          await createOrderFromCharge(charge, cartIdFromCharge, emailFromCharge)
        } else {
          console.error('No cart ID found in charge metadata:', charge.metadata)
          return NextResponse.json({ 
            error: 'No cart ID in charge metadata',
            received: true 
          }, { status: 400 })
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment intent succeeded:', paymentIntent.id)
        console.log('Payment intent metadata:', paymentIntent.metadata)
        
        const cartIdFromPI = paymentIntent.metadata.cartId || paymentIntent.metadata.cart_id
        const emailFromPI = paymentIntent.metadata.email
        
        if (cartIdFromPI) {
          await createOrderFromPaymentIntent(paymentIntent, cartIdFromPI, emailFromPI)
        } else {
          console.error('No cart ID found in payment intent metadata:', paymentIntent.metadata)
          return NextResponse.json({ 
            error: 'No cart ID in payment intent metadata',
            received: true 
          }, { status: 400 })
        }
        break

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedIntent.id)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
    
    return NextResponse.json({ received: true, processed: true })
    
  } catch (error) {
    console.error('Error processing webhook event:', error)
    return NextResponse.json({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      received: true 
    }, { status: 500 })
  }
}

async function createOrderFromCharge(charge: Stripe.Charge, cartId: string, email?: string) {
  console.log('Creating order from charge:', { chargeId: charge.id, cartId, email })
  return createOrderInMedusa(cartId, {
    charge_id: charge.id,
    amount: charge.amount,
    email: email,
    payment_method: 'stripe_charge'
  })
}

async function createOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent, cartId: string, email?: string) {
  console.log('Creating order from payment intent:', { paymentIntentId: paymentIntent.id, cartId, email })
  return createOrderInMedusa(cartId, {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    email: email,
    payment_method: 'stripe_payment_intent'
  })
}

async function createOrderInMedusa(cartId: string, paymentData: any) {
  try {
    // Try to complete cart in Medusa
    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'
    const medusaKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    
    console.log('Attempting to complete cart in Medusa:', cartId)
    
    const response = await fetch(`${medusaUrl}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': medusaKey!,
      },
      body: JSON.stringify({})
    })
    
    const responseText = await response.text()
    console.log('Medusa response status:', response.status)
    console.log('Medusa response body:', responseText)
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('✅ Order created in Medusa:', data)
      return { success: true, order: data }
    } else {
      console.error('❌ Failed to create order in Medusa:', response.status, responseText)
      
      // Log the payment data for manual order creation
      console.log('Payment data for manual order creation:', {
        cart_id: cartId,
        ...paymentData,
        status: 'paid',
        created_at: new Date().toISOString()
      })
      
      throw new Error(`Medusa API error: ${response.status} - ${responseText}`)
    }
  } catch (error) {
    console.error('Error completing cart in Medusa:', error)
    throw error
  }
}
