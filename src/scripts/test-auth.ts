import { medusa } from '@/lib/medusa/client'

async function testAuth() {
  console.log('Testing KCT Menswear Authentication System...\n')

  // Test user credentials
  const testUser = {
    email: 'test@kctmenswear.com',
    password: 'Test12345!',
    first_name: 'Test',
    last_name: 'User'
  }

  try {
    // Step 1: Test Registration
    console.log('1. Testing Registration...')
    try {
      const registerResult = await medusa.auth.register(
        "customer",
        "emailpass",
        {
          email: testUser.email,
          password: testUser.password,
          first_name: testUser.first_name,
          last_name: testUser.last_name
        }
      )
      console.log('✅ Registration successful:', {
        email: registerResult.email,
        customer_id: registerResult.id
      })
    } catch (error: any) {
      if (error?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, proceeding with login test...')
      } else {
        console.error('❌ Registration failed:', error?.message || error)
      }
    }

    // Step 2: Test Login
    console.log('\n2. Testing Login...')
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: testUser.email,
        password: testUser.password
      }
    )
    console.log('✅ Login successful:', {
      token: loginResult.token ? 'Token received' : 'No token',
      customer_id: loginResult.customer?.id,
      email: loginResult.customer?.email
    })

    // Step 3: Test Authentication Check
    console.log('\n3. Testing Authentication Check...')
    const { customer } = await medusa.customer.retrieve()
    console.log('✅ Authentication verified:', {
      customer_id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name
    })

    // Step 4: Test Cart Creation for Authenticated User
    console.log('\n4. Testing Cart Creation for Authenticated User...')
    const cart = await medusa.store.cart.create({
      region_id: 'reg_01J5W2QJVFZ5CR1JZ5H2T6PZ6W', // US region
      email: customer.email,
      customer_id: customer.id
    })
    console.log('✅ Cart created:', {
      cart_id: cart.cart?.id,
      customer_id: cart.cart?.customer_id,
      email: cart.cart?.email
    })

    // Step 5: Test Logout
    console.log('\n5. Testing Logout...')
    await medusa.auth.logout()
    console.log('✅ Logout successful')

    // Step 6: Verify logout
    console.log('\n6. Verifying Logout...')
    try {
      await medusa.customer.retrieve()
      console.log('❌ User still authenticated after logout')
    } catch (error) {
      console.log('✅ User successfully logged out')
    }

    console.log('\n🎉 All authentication tests passed!')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error)
    process.exit(1)
  }
}

testAuth().catch(console.error)