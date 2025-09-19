import { medusa } from '@/lib/medusa/client'

async function testAuthFlow() {
  console.log('Testing Authentication Flow...\n')

  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  console.log('Backend URL:', baseUrl)
  console.log('Publishable Key:', publishableKey ? 'Set' : 'Not set')

  // Test user credentials
  const testUser = {
    email: 'test@kctmenswear.com',
    password: 'Test12345!'
  }

  try {
    // Step 1: Test Login
    console.log('\n1. Testing Login...')
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: testUser.email,
        password: testUser.password
      }
    )

    const token = loginResult.token || loginResult
    console.log('Login result:', {
      tokenReceived: !!token,
      tokenType: typeof token,
      tokenLength: token?.length
    })

    // Step 2: Set token and retrieve customer
    if (token && typeof token === 'string') {
      console.log('\n2. Setting token in SDK...')

      if (medusa.auth.setToken_) {
        medusa.auth.setToken_('customer', token)
        console.log('✅ Token set in SDK')
      } else {
        console.log('⚠️  setToken_ method not available')
      }

      console.log('\n3. Retrieving customer data...')
      try {
        const { customer } = await medusa.store.customer.retrieve()
        console.log('✅ Customer retrieved:', {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name
        })
      } catch (error: any) {
        console.error('❌ Failed to retrieve customer:', error?.message || error)
      }

      // Step 3: Test creating a cart with auth
      console.log('\n4. Testing cart creation with auth...')
      try {
        const cart = await medusa.store.cart.create({
          region_id: 'reg_01J5W2QJVFZ5CR1JZ5H2T6PZ6W' // US region
        })
        console.log('✅ Cart created:', {
          cart_id: cart.cart?.id,
          customer_id: cart.cart?.customer_id,
          email: cart.cart?.email
        })
      } catch (error: any) {
        console.error('❌ Failed to create cart:', error?.message || error)
      }

      // Step 4: Test logout
      console.log('\n5. Testing logout...')
      await medusa.auth.logout()
      console.log('✅ Logged out')

      // Step 5: Verify logout
      console.log('\n6. Verifying logout...')
      try {
        await medusa.store.customer.retrieve()
        console.log('❌ Still authenticated after logout')
      } catch (error) {
        console.log('✅ Successfully logged out - customer retrieval failed as expected')
      }
    }

    console.log('\n✅ Auth flow test completed!')

  } catch (error: any) {
    console.error('\n❌ Auth flow test failed:', error?.message || error)
  }
}

testAuthFlow().catch(console.error)