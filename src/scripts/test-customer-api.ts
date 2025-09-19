import { medusa } from '@/lib/medusa/client'

async function testCustomerAPI() {
  console.log('Testing Customer API...\n')

  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app"

  // First login to get token
  console.log('1. Logging in to get token...')
  const loginResponse = await fetch(`${baseUrl}/auth/customer/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@kctmenswear.com',
      password: 'Test12345!'
    })
  })

  const { token } = await loginResponse.json()
  console.log('Got token:', token ? 'Yes' : 'No')

  // Test getting customer info with token
  console.log('\n2. Testing customer retrieval with token...')
  const customerResponse = await fetch(`${baseUrl}/store/customers/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  console.log('Customer response status:', customerResponse.status)
  const customerData = await customerResponse.json()
  console.log('Customer data:', customerData)

  // Test with SDK
  console.log('\n3. Testing SDK customer methods...')
  console.log('medusa.store.customer methods:', Object.keys(medusa.store.customer || {}))

  // Set the token in the SDK
  if (medusa.auth.setToken_) {
    console.log('\n4. Setting token in SDK...')
    medusa.auth.setToken_('customer', token)

    // Try to retrieve customer with SDK
    try {
      console.log('5. Retrieving customer with SDK...')
      const sdkCustomer = await medusa.store.customer.retrieve()
      console.log('SDK customer:', sdkCustomer)
    } catch (error: any) {
      console.log('SDK customer error:', error?.message || error)
    }
  }
}

testCustomerAPI().catch(console.error)