import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with secret key from environment
// IMPORTANT: Set STRIPE_SECRET_KEY in Railway environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-04-10', // Use latest stable API version
}) : null!

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, cartId, email } = body

    if (!amount || !cartId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a PaymentIntent with the correct API version
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true, // Enable all payment methods
      },
      metadata: {
        cartId,
        email: email || '',
      },
      // Don't include any Amazon Pay or express checkout options
      // These cause the parameter_invalid_empty error
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    })
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, cartId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // Payment successful, complete the order
      // You would typically call your backend here to complete the order
      
      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        orderId: cartId, // In production, create actual order
      })
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      message: 'Payment not yet completed',
    })
  } catch (error: any) {
    console.error('Stripe payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}