// Test webhook endpoint
const https = require('https');
const crypto = require('crypto');

// Test payload
const payload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2024-10-28',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      customer_email: 'test@example.com',
      metadata: {
        order_details: JSON.stringify([{
          productId: 'test-product',
          productName: 'Test Suit',
          size: '40R',
          color: 'navy',
          quantity: 1,
          price: 299
        }])
      },
      shipping_details: {
        name: 'Test Customer',
        address: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'MI',
          postal_code: '12345',
          country: 'US'
        }
      }
    }
  },
  type: 'checkout.session.completed',
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  }
});

// Generate test signature
const secret = 'whsec_test_secret';
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(signedPayload, 'utf8')
  .digest('hex');
const signature = `t=${timestamp},v1=${expectedSignature}`;

// Test local endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stripe/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'stripe-signature': signature
  }
};

console.log('Testing webhook endpoint...');
console.log('URL: http://localhost:3000/api/stripe/webhook');
console.log('Signature:', signature);
console.log('Payload:', payload);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('Response Body:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(payload);
req.end();