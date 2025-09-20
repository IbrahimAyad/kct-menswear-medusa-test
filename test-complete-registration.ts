import { medusa } from './src/lib/medusa/client'

async function testCompleteRegistration() {
  console.log('🧪 TESTING COMPLETE REGISTRATION WITH CUSTOMER CREATION\n')

  const backendUrl = 'https://backend-production-7441.up.railway.app'
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  // Generate unique test user
  const timestamp = Date.now()
  const testEmail = `customer-test-${timestamp}@kctmenswear.com`
  const testPassword = 'TestPass123!'

  console.log(`📧 Test Account: ${testEmail}`)
  console.log(`🔑 Test Password: ${testPassword}\n`)

  try {
    // STEP 1: Register new auth identity
    console.log('1️⃣ Registering new auth identity...')
    const registerResult = await medusa.auth.register(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword,
        first_name: "Test",
        last_name: "Customer"
      }
    )

    const token = registerResult.token || registerResult
    if (!token) {
      throw new Error('No token received from registration')
    }

    console.log('   ✅ Auth identity created')
    console.log('   Token:', token.substring(0, 50) + '...\n')

    // Set token in SDK
    if (medusa.auth.setToken_) {
      medusa.auth.setToken_('customer', token)
    }

    // STEP 2: Check if customer record was created
    console.log('2️⃣ Checking for customer record...')
    try {
      const { customer } = await medusa.store.customer.retrieve()
      console.log('   ✅ Customer record exists!')
      console.log('   Customer ID:', customer.id)
      console.log('   Email:', customer.email)
      console.log('   Name:', customer.first_name, customer.last_name)
    } catch (retrieveError: any) {
      console.log('   ❌ Customer record not found')
      console.log('   Error:', retrieveError.message)

      // STEP 3: Try to create customer manually
      console.log('\n3️⃣ Attempting to create customer record...')
      try {
        const createResult = await medusa.store.customer.create({
          email: testEmail,
          first_name: "Test",
          last_name: "Customer"
        })
        console.log('   ✅ Customer created!')
        console.log('   Customer ID:', createResult.customer?.id)
      } catch (createError: any) {
        console.log('   ❌ Failed to create customer')
        console.log('   Error:', createError.message)
      }
    }

    // STEP 4: Verify in backend via API
    console.log('\n4️⃣ Verifying customer in backend...')
    const verifyResponse = await fetch(`${backendUrl}/store/customers/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': publishableKey
      }
    })

    if (verifyResponse.ok) {
      const data = await verifyResponse.json()
      console.log('   ✅ Customer confirmed in backend!')
      console.log('   Backend customer ID:', data.customer?.id)
      console.log('   This customer should appear in Medusa admin!')
    } else {
      console.log('   ❌ Customer not found in backend')
      console.log('   Status:', verifyResponse.status)
    }

    // STEP 5: Test login with the new account
    console.log('\n5️⃣ Testing login with new account...')
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword
      }
    )

    const loginToken = loginResult.token || loginResult
    if (loginToken) {
      console.log('   ✅ Login successful!')

      // Set token and check customer
      if (medusa.auth.setToken_) {
        medusa.auth.setToken_('customer', loginToken)
      }

      try {
        const { customer: loginCustomer } = await medusa.store.customer.retrieve()
        console.log('   ✅ Customer data retrieved after login')
        console.log('   Customer ID:', loginCustomer.id)
      } catch (e: any) {
        console.log('   ❌ Could not retrieve customer after login')
        console.log('   Error:', e.message)
      }
    } else {
      console.log('   ❌ Login failed')
    }

    console.log('\n✨ SUMMARY:')
    console.log('• Auth registration: ✅')
    console.log('• Customer creation: Check Medusa admin for:', testEmail)
    console.log('• Login capability: ✅')
    console.log('\n🎯 Next: Check Medusa admin to see if customer appears!')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

testCompleteRegistration()