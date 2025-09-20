import { medusa } from './src/lib/medusa/client'

async function testFinalWorking() {
  console.log('🚀 FINAL TEST - Subscribers Should Now Load!\n');
  console.log('Backend fixes applied:');
  console.log('✅ package.json start script copies src/subscribers');
  console.log('✅ postBuild.js copies src/subscribers during build');
  console.log('✅ Subscribers use correct export format\n');

  const backendUrl = 'https://backend-production-7441.up.railway.app';
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

  // Test with new account
  const timestamp = Date.now();
  const testEmail = `working-${timestamp}@kctmenswear.com`;
  const testPassword = 'TestPass123!';

  console.log(`📧 New test account: ${testEmail}\n`);

  try {
    console.log('1️⃣ Creating new account...');
    const registerResult = await medusa.auth.register(
      "customer",
      "emailpass",
      {
        email: testEmail,
        password: testPassword,
        first_name: "Working",
        last_name: "Test"
      }
    );

    const token = registerResult.token || registerResult;
    console.log('   ✅ Registration successful');
    console.log('   🔄 Subscribers should create customer...\n');

    if (medusa.auth.setToken_) {
      medusa.auth.setToken_('customer', token);
    }

    // Wait for processing
    console.log('2️⃣ Waiting 5 seconds for backend...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check customer
    console.log('\n3️⃣ Checking for customer...');
    try {
      const { customer } = await medusa.store.customer.retrieve();
      console.log('   ✅✅✅ CUSTOMER FOUND! IT WORKS!');
      console.log('   Customer ID:', customer.id);
      console.log('   Email:', customer.email);
      console.log('\n🎊 SUCCESS! Subscribers are working!');
    } catch (e: any) {
      console.log('   ❌ Customer not in SDK');

      // Check API
      const check = await fetch(`${backendUrl}/store/customers/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': publishableKey
        }
      });

      if (check.ok) {
        const data = await check.json();
        console.log('   ✅ Customer exists in backend!');
        console.log('   Customer ID:', data.customer?.id);
      } else {
        console.log('   ❌ Still not working');
        console.log('   Check Railway logs for subscriber errors');
      }
    }

  } catch (error: any) {
    console.error('Test error:', error.message);
  }

  // Also test existing account
  console.log('\n4️⃣ Testing kctmenswear@gmail.com...');
  try {
    const login = await medusa.auth.login("customer", "emailpass", {
      email: 'kctmenswear@gmail.com',
      password: 'theking13'
    });

    const token = login.token || login;
    if (medusa.auth.setToken_) {
      medusa.auth.setToken_('customer', token);
    }

    const { customer } = await medusa.store.customer.retrieve();
    console.log('   ✅ Existing account works!');
    console.log('   Customer ID:', customer.id);
  } catch (e: any) {
    console.log('   ❌ Still issues with existing account');
  }

  console.log('\n📊 Check Railway logs - subscribers should be loading now!');
}

testFinalWorking();