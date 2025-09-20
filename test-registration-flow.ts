import { medusa } from './src/lib/medusa/client'

async function testRegistrationFlow() {
  console.log('🔬 TESTING MEDUSA 2.0 REGISTRATION FLOW\n')

  // Generate unique test user
  const timestamp = Date.now()
  const testEmail = `flow-test-${timestamp}@kctmenswear.com`
  const testPassword = 'TestPass123!'

  console.log(`📧 Test Account: ${testEmail}`)
  console.log(`🔑 Test Password: ${testPassword}\n`)

  try {
    console.log('🔍 Checking if customer.create is for unauthenticated users...')

    // Try to create customer WITHOUT authentication first
    console.log('\n1️⃣ Attempting customer.create WITHOUT authentication...')
    try {
      const createResult = await medusa.store.customer.create({
        email: testEmail,
        first_name: "Flow",
        last_name: "Test"
      })
      console.log('   ✅ Customer created without auth!')
      console.log('   Customer ID:', createResult.customer?.id)
      console.log('   This means customer.create is for registration, not for authenticated users!\n')

      // Now try to create auth identity for this customer
      console.log('2️⃣ Creating auth identity for existing customer...')
      try {
        const authResult = await medusa.auth.register(
          "customer",
          "emailpass",
          {
            email: testEmail,
            password: testPassword
          }
        )
        console.log('   ✅ Auth identity created for existing customer')
        console.log('   Token:', authResult.token?.substring(0, 50) + '...')
      } catch (authError: any) {
        console.log('   ❌ Failed to create auth:', authError.message)
      }

    } catch (createError: any) {
      console.log('   ❌ Failed:', createError.message)
      console.log('   This confirms customer.create requires authentication\n')

      // Traditional flow: auth first, then customer
      console.log('2️⃣ Traditional flow: Auth registration first...')
      const authResult = await medusa.auth.register(
        "customer",
        "emailpass",
        {
          email: testEmail,
          password: testPassword,
          first_name: "Flow",
          last_name: "Test"
        }
      )

      const token = authResult.token || authResult
      console.log('   ✅ Auth created, token:', token.substring(0, 50) + '...')

      // Set token
      if (medusa.auth.setToken_) {
        medusa.auth.setToken_('customer', token)
      }

      console.log('\n3️⃣ Checking if customer was auto-created...')
      try {
        const { customer } = await medusa.store.customer.retrieve()
        console.log('   ✅ Customer exists!')
        console.log('   ID:', customer.id)
        console.log('   Email:', customer.email)
        console.log('   🎯 This means Medusa backend auto-creates customers!')
      } catch (e: any) {
        console.log('   ❌ No customer found:', e.message)
        console.log('   🤔 Backend might not be auto-creating customers')

        // Try manual creation
        console.log('\n4️⃣ Trying manual customer creation with token...')
        try {
          const createResult = await medusa.store.customer.create({
            email: testEmail,
            first_name: "Flow",
            last_name: "Test"
          })
          console.log('   ✅ Manual creation worked!')
          console.log('   ID:', createResult.customer?.id)
        } catch (createErr: any) {
          console.log('   ❌ Manual creation failed:', createErr.message)
        }
      }
    }

    console.log('\n📊 FINDINGS:')
    console.log('• customer.create() is likely for guest checkout, not authenticated users')
    console.log('• After auth.register(), customer should be auto-created by backend')
    console.log('• If not auto-created, we might need backend modification')
    console.log('• The "Unauthorized" error suggests customer.create() conflicts with auth token')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

testRegistrationFlow()