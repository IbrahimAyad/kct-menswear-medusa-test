import { medusa } from './src/lib/medusa/client'

async function testFinalCustomerFlow() {
  console.log('🎯 FINAL TEST: Customer Creation with Backend Subscriber\n')
  console.log('Backend now has auth-customer-sync subscriber that should:')
  console.log('1. Listen for auth.identity_created events')
  console.log('2. Automatically create customer records')
  console.log('3. Link auth identities to customers\n')

  const backendUrl = 'https://backend-production-7441.up.railway.app'
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  // Generate unique test user
  const timestamp = Date.now()
  const testEmail = `final-test-${timestamp}@kctmenswear.com`
  const testPassword = 'TestPass123!'

  console.log(`📧 Test Account: ${testEmail}`)
  console.log(`🔑 Test Password: ${testPassword}\n`)

  try {
    // STEP 1: Register new auth identity
    console.log('1️⃣ Registering new user...')
    const registerResult = await medusa.auth.register(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword,
        first_name: "Final",
        last_name: "Test"
      }
    )

    const token = registerResult.token || registerResult
    if (!token) {
      throw new Error('No token received from registration')
    }

    console.log('   ✅ Auth identity created')
    console.log('   Token:', token.substring(0, 50) + '...')
    console.log('   🔄 Backend subscriber should now be creating customer record...\n')

    // Set token in SDK
    if (medusa.auth.setToken_) {
      medusa.auth.setToken_('customer', token)
    }

    // STEP 2: Wait a moment for backend to process
    console.log('2️⃣ Waiting 3 seconds for backend to process...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // STEP 3: Try to retrieve customer
    console.log('\n3️⃣ Attempting to retrieve customer...')
    try {
      const { customer } = await medusa.store.customer.retrieve()
      console.log('   ✅ CUSTOMER FOUND!')
      console.log('   Customer ID:', customer.id)
      console.log('   Email:', customer.email)
      console.log('   Name:', customer.first_name, customer.last_name)
      console.log('\n🎉 SUCCESS! Backend is auto-creating customers!')
    } catch (retrieveError: any) {
      console.log('   ❌ Customer not found yet')
      console.log('   Error:', retrieveError.message)
      console.log('\n   Checking backend directly...')

      // STEP 4: Check via API
      const verifyResponse = await fetch(`${backendUrl}/store/customers/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': publishableKey
        }
      })

      if (verifyResponse.ok) {
        const data = await verifyResponse.json()
        console.log('   ✅ Customer exists in backend!')
        console.log('   Customer ID:', data.customer?.id)
        console.log('\n🎉 Backend created customer, SDK might need refresh')
      } else {
        console.log('   ❌ Customer not in backend either')
        console.log('   Status:', verifyResponse.status)
        console.log('\n⚠️ Backend subscriber might not be working yet')
      }
    }

    // STEP 5: Test login
    console.log('\n4️⃣ Testing login with the new account...')
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword
      }
    )

    if (loginResult.token || loginResult) {
      console.log('   ✅ Login successful!')
    }

    console.log('\n📊 FINAL SUMMARY:')
    console.log('✅ Frontend: Auth registration working')
    console.log('✅ Frontend: Login working')
    console.log('✅ Frontend: Handles missing customer gracefully')
    console.log('🔄 Backend: Auth-customer subscriber deployed')
    console.log('📋 Next: Check Medusa admin at https://backend-production-7441.up.railway.app/app')
    console.log(`     Look for: ${testEmail}`)

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

testFinalCustomerFlow()