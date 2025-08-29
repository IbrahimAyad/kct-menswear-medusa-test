#!/bin/bash

# Simple test without signature to see if endpoint is reachable
echo "Testing webhook endpoint (no signature)..."

URL="https://kct-menswear-v2.vercel.app/api/stripe/webhook"

# Test if endpoint exists
echo "Testing ${URL}"
echo ""

curl -i -X POST "${URL}" \
  -H "Content-Type: application/json" \
  -d '{"test": "simple"}'