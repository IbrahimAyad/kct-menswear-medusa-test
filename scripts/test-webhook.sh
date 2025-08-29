#!/bin/bash

# Test webhook endpoint with curl
echo "Testing webhook endpoint..."

# Test payload
PAYLOAD='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2024-10-28",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "cs_test_123",
      "object": "checkout.session",
      "customer_email": "test@example.com"
    }
  },
  "type": "checkout.session.completed",
  "livemode": false,
  "pending_webhooks": 1
}'

# Generate test signature
TIMESTAMP=$(date +%s)
SECRET="whsec_test_secret"
SIGNED_PAYLOAD="${TIMESTAMP}.${PAYLOAD}"
SIGNATURE=$(echo -n "${SIGNED_PAYLOAD}" | openssl dgst -sha256 -hmac "${SECRET}" | sed 's/^.* //')
STRIPE_SIGNATURE="t=${TIMESTAMP},v1=${SIGNATURE}"

echo "Timestamp: ${TIMESTAMP}"
echo "Signature: ${STRIPE_SIGNATURE}"
echo ""

# Test local endpoint
if [ "$1" == "local" ]; then
  URL="http://localhost:3000/api/stripe/webhook"
else
  # Test production endpoint
  URL="https://kct-menswear-v2.vercel.app/api/stripe/webhook"
fi

echo "Testing ${URL}"
echo ""

curl -i -X POST "${URL}" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: ${STRIPE_SIGNATURE}" \
  -d "${PAYLOAD}"