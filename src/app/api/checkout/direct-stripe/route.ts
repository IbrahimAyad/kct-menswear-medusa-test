import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe only if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-06-20',
}) : null

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      // Return a mock response for development without Stripe
      console.log('Stripe not configured, returning mock checkout URL')
      return NextResponse.json({
        url: `${request.nextUrl.origin}/checkout/success?session_id=mock_${Date.now()}`,
        sessionId: `mock_${Date.now()}`
      })
    }

    const body = await request.json()
    const { email, shipping, items, subtotal, tax_total, shipping_total, total } = body

    // Create line items for Stripe
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || undefined,
        },
        unit_amount: Math.round(item.amount), // Amount in cents
      },
      quantity: item.quantity,
    }))

    // Add tax as a line item if present
    if (tax_total > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Sales Tax',
            description: `Tax for ${shipping.address.state}`,
          },
          unit_amount: Math.round(tax_total),
        },
        quantity: 1,
      })
    }

    // Add shipping as a line item if present
    if (shipping_total > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shipping_total),
        },
        quantity: 1,
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/kct-shop`,
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        cartId: body.cartId || 'direct_checkout',
        source: 'kct_menswear',
        tax_amount: tax_total.toString(),
        shipping_amount: shipping_total.toString(),
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    
    // Return fallback for development
    if (!stripeKey) {
      return NextResponse.json({
        url: `${request.nextUrl.origin}/checkout/success?session_id=dev_${Date.now()}`,
        sessionId: `dev_${Date.now()}`
      })
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}