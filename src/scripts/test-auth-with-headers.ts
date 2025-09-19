async function testAuthWithHeaders() {
  console.log('Testing Auth with proper headers...\n')

  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  // Test user credentials
  const testUser = {
    email: 'test@kctmenswear.com',
    password: 'Test12345!'
  }

  try {
    // Step 1: Login to get token
    console.log('1. Logging in...')
    const loginResponse = await fetch(`${baseUrl}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    })

    const { token } = await loginResponse.json()
    console.log('✅ Got token:', token ? 'Yes' : 'No')

    // Step 2: Test customer retrieval with both headers
    console.log('\n2. Retrieving customer with proper headers...')
    const customerResponse = await fetch(`${baseUrl}/store/customers/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': publishableKey
      }
    })

    const customerData = await customerResponse.json()
    console.log('Customer response status:', customerResponse.status)

    if (customerResponse.ok) {
      console.log('✅ Customer retrieved:', {
        id: customerData.customer?.id,
        email: customerData.customer?.email,
        first_name: customerData.customer?.first_name,
        last_name: customerData.customer?.last_name
      })
    } else {
      console.log('❌ Customer retrieval failed:', customerData)
    }

    // Step 3: Test creating a cart with auth
    console.log('\n3. Creating cart with auth...')

    // First get the regions
    const regionsResponse = await fetch(`${baseUrl}/store/region`, {
      headers: {
        'x-publishable-api-key': publishableKey
      }
    })

    const regionsData = await regionsResponse.json()
    console.log('Available regions:', regionsData.regions?.map((r: any) => ({ id: r.id, name: r.name })))

    const regionId = regionsData.regions?.[0]?.id

    if (regionId) {
      const cartResponse = await fetch(`${baseUrl}/store/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': publishableKey
        },
        body: JSON.stringify({
          region_id: regionId
        })
      })

      const cartData = await cartResponse.json()

      if (cartResponse.ok) {
        console.log('✅ Cart created:', {
          cart_id: cartData.cart?.id,
          customer_id: cartData.cart?.customer_id,
          email: cartData.cart?.email
        })
      } else {
        console.log('❌ Cart creation failed:', cartData)
      }
    }

    console.log('\n✅ All tests completed!')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error)
  }
}

testAuthWithHeaders().catch(console.error)