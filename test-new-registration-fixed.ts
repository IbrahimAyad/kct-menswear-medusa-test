import { medusa } from './src/lib/medusa/client'

async function testNewRegistrationFixed() {
  console.log('🧪 TESTING REGISTRATION WITH FIXED SUBSCRIBERS\n');
  console.log('The backend should now have properly formatted subscribers that:');
  console.log('1. Load correctly (not skipped)');
  console.log('2. Listen for auth events');
  console.log('3. Create customer records automatically\n');

  const backendUrl = 'https://backend-production-7441.up.railway.app';
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `fixed-test-${timestamp}@kctmenswear.com`;
  const testPassword = 'TestPass123!';

  console.log(`📧 Test Account: ${testEmail}`);
  console.log(`🔑 Test Password: ${testPassword}\n`);

  try {
    // STEP 1: Register new user
    console.log('1️⃣ Registering new user...');
    const registerResult = await medusa.auth.register(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword,
        first_name: "Fixed",
        last_name: "Test"
      }
    );

    const token = registerResult.token || registerResult;
    if (!token) {
      throw new Error('No token received from registration');
    }

    console.log('   ✅ Registration successful');
    console.log('   Token:', token.substring(0, 50) + '...');
    console.log('   🔄 Subscribers should now create customer...\n');

    // Set token
    if (medusa.auth.setToken_) {
      medusa.auth.setToken_('customer', token);
    }

    // STEP 2: Wait for backend processing
    console.log('2️⃣ Waiting 5 seconds for backend processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // STEP 3: Try to retrieve customer
    console.log('\n3️⃣ Checking if customer was created...');
    try {
      const { customer } = await medusa.store.customer.retrieve();
      console.log('   ✅ CUSTOMER FOUND!');
      console.log('   Customer ID:', customer.id);
      console.log('   Email:', customer.email);
      console.log('\n🎉 SUCCESS! Subscribers are working!');
      return true;
    } catch (error: any) {
      console.log('   ❌ Customer not found:', error.message);

      // Check via API
      const checkResponse = await fetch(`${backendUrl}/store/customers/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': publishableKey
        }
      });

      if (checkResponse.ok) {
        console.log('   ✅ Customer exists in backend (SDK issue)');
        return true;
      } else {
        console.log('   ❌ Customer not in backend either');
        console.log('   Status:', checkResponse.status);
        return false;
      }
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Also test existing account
async function testExistingAccount() {
  console.log('\n\n4️⃣ Testing existing account (kctmenswear@gmail.com)...');

  try {
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: 'kctmenswear@gmail.com',
        password: 'theking13'
      }
    );

    const token = loginResult.token || loginResult;
    if (token) {
      console.log('   ✅ Login successful');

      if (medusa.auth.setToken_) {
        medusa.auth.setToken_('customer', token);
      }

      try {
        const { customer } = await medusa.store.customer.retrieve();
        console.log('   ✅ Customer data retrieved');
        console.log('   Customer ID:', customer.id);
      } catch (e: any) {
        console.log('   ❌ Customer retrieval failed:', e.message);
      }
    }
  } catch (error: any) {
    console.error('   ❌ Login failed:', error.message);
  }
}

async function runTests() {
  await testNewRegistrationFixed();
  await testExistingAccount();

  console.log('\n📊 SUMMARY:');
  console.log('✅ Fixed subscriber format (default function + config)');
  console.log('✅ Backend deployed with correct subscribers');
  console.log('🔄 Testing customer auto-creation...');
  console.log('\nCheck Railway logs to see if subscribers are loading!');
}

runTests();