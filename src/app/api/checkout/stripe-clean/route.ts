import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Clean Stripe initialization without any optional parameters
const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables')
}

// Initialize Stripe with minimal configuration
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-04-10',
}) : null

export async function POST(request: NextRequest) {
  console.log('=== Clean Stripe Payment Intent Creation ===')
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers })
  }
  
  try {
    if (!stripe) {
      console.error('Stripe not initialized')
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          debug: {
            hasKey: !!process.env.STRIPE_SECRET_KEY,
            keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
          }
        },
        { status: 500, headers }
      )
    }

    const body = await request.json()
    const { amount, cartId, email } = body
    
    console.log('Creating clean payment intent:', { amount, cartId })

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400, headers }
      )
    }

    // Create the SIMPLEST possible PaymentIntent
    // No express checkout, no Amazon Pay, just basic card payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      // Only use basic automatic payment methods
      automatic_payment_methods: {
        enabled: true,
        // Explicitly exclude problematic payment methods
        allow_redirects: 'never'
      },
      metadata: {
        cartId: cartId || 'no-cart-id',
        email: email || 'no-email'
      }
    })
    
    console.log('✅ Clean payment intent created:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount
    }, { headers })
    
  } catch (error: any) {
    console.error('❌ Clean Stripe error:', error)
    
    // If automatic_payment_methods fails, try manual configuration
    if (error.message?.includes('automatic_payment_methods') || error.message?.includes('allow_redirects')) {
      try {
        console.log('Retrying with manual payment method configuration...')
        
        const body = await request.json()
        const { amount, cartId, email } = body
        
        // Fallback to explicit payment method types
        const paymentIntent = await stripe!.paymentIntents.create({
          amount: Math.round(amount),
          currency: 'usd',
          payment_method_types: ['card'], // Only card payments
          metadata: {
            cartId: cartId || 'no-cart-id',
            email: email || 'no-email'
          }
        })
        
        console.log('✅ Manual payment intent created:', paymentIntent.id)
        
        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount
        }, { headers })
        
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError)
        return NextResponse.json(
          { 
            error: fallbackError.message || 'Failed to create payment intent',
            type: fallbackError.type,
            code: fallbackError.code
          },
          { status: 500, headers }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create payment intent',
        type: error.type,
        code: error.code,
        param: error.param
      },
      { status: 500, headers }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}