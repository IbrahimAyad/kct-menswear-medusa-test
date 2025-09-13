#!/usr/bin/env node

/**
 * Webhook Test Script
 * Tests the fixed webhook implementation with charge.succeeded events
 */

const crypto = require('crypto');

// Simulate a charge.succeeded event
const testEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'ch_test_charge_succeeded',
      object: 'charge',
      amount: 106, // $1.06
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        cartId: 'cart_01K50JSH6G66CZD92VZDKMGEDD',
        email: 'test@example.com'
      },
      payment_intent: 'pi_test_payment_intent'
    }
  },
  type: 'charge.succeeded',
  api_version: '2024-04-10'
};

// Function to create Stripe signature
function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhook() {
  console.log('🧪 Testing Webhook Fix for charge.succeeded event');
  console.log('==========================================');
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/stripe';
  
  console.log('Test Event:', JSON.stringify(testEvent, null, 2));
  console.log('\nWebhook URL:', webhookUrl);
  
  try {
    const signature = createStripeSignature(testEvent, webhookSecret);
    console.log('\nGenerated Signature:', signature);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(testEvent)
    });
    
    const responseText = await response.text();
    
    console.log('\n📊 Webhook Response:');
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.received && data.processed) {
        console.log('✅ SUCCESS: Webhook processed correctly');
      } else {
        console.log('⚠️  WARNING: Webhook received but may not have processed correctly');
      }
    } else {
      console.log('❌ FAILED: Webhook returned error status');
    }
    
  } catch (error) {
    console.error('❌ ERROR testing webhook:', error.message);
  }
}

// Test with payment_intent.succeeded as well
async function testPaymentIntentWebhook() {
  console.log('\n\n🧪 Testing payment_intent.succeeded event');
  console.log('==========================================');
  
  const testEventPI = {
    ...testEvent,
    id: 'evt_test_webhook_pi',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_payment_intent_succeeded',
        object: 'payment_intent',
        amount: 106,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          cartId: 'cart_01K50JSH6G66CZD92VZDKMGEDD',
          email: 'test@example.com'
        }
      }
    }
  };
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/stripe';
  
  try {
    const signature = createStripeSignature(testEventPI, webhookSecret);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: JSON.stringify(testEventPI)
    });
    
    const responseText = await response.text();
    
    console.log('\n📊 Payment Intent Webhook Response:');
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.received && data.processed) {
        console.log('✅ SUCCESS: Payment Intent webhook processed correctly');
      } else {
        console.log('⚠️  WARNING: Payment Intent webhook received but may not have processed correctly');
      }
    } else {
      console.log('❌ FAILED: Payment Intent webhook returned error status');
    }
    
  } catch (error) {
    console.error('❌ ERROR testing payment intent webhook:', error.message);
  }
}

async function main() {
  await testWebhook();
  await testPaymentIntentWebhook();
  
  console.log('\n\n📋 Next Steps:');
  console.log('1. Verify webhook URL is correct in Stripe dashboard');
  console.log('2. Check that webhook secret matches environment variable');
  console.log('3. Monitor webhook logs in Railway/Vercel deployment');
  console.log('4. Test with a real payment to confirm order creation');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testWebhook, testPaymentIntentWebhook };