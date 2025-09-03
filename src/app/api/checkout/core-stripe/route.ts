import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { items, cartItems } = await request.json()
    
    if (!items || items.length === 0) {
      return NextResponse.json({ 
        error: 'No items provided' 
      }, { status: 400 })
    }

    // Filter items to ensure we have valid line items
    const validLineItems = items.filter((item: any) => {
      // Must have either a price ID or price_data
      return item.price || item.price_data
    })

    if (validLineItems.length === 0) {
      return NextResponse.json({ 
        error: 'No valid items for checkout' 
      }, { status: 400 })
    }

    // Create Stripe checkout session for core products
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: validLineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=core`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cart`,
      metadata: {
        type: 'core_products',
        items: JSON.stringify(cartItems?.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          size: item.size
        })) || [])
      },
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      billing_address_collection: 'required',
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'usd',
            },
            display_name: 'Free shipping (5-7 business days)',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'usd',
            },
            display_name: 'Express shipping (2-3 business days)',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 3,
              },
            },
          },
        },
      ],
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Core Stripe checkout error:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
      success: false 
    }, { status: 500 })
  }
}