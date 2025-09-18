// End-to-end test for KCT Menswear
// Tests: Navigation, Add to Cart, and Checkout Flow

const FRONTEND_URL = 'http://localhost:3000';
const MEDUSA_URL = 'https://backend-production-7441.up.railway.app';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function testProductNavigation() {
  section('1. TESTING PRODUCT NAVIGATION');

  try {
    // Test homepage
    info('Testing homepage loads...');
    const homeResponse = await fetch(FRONTEND_URL);
    if (homeResponse.ok) {
      const html = await homeResponse.text();
      if (html.includes('Featured Pieces')) {
        success('Homepage loads with Featured Pieces section');
      } else {
        error('Homepage missing Featured Pieces section');
      }
    } else {
      error(`Homepage returned ${homeResponse.status}`);
    }

    // Test product detail page
    info('Testing product detail page...');
    const productUrl = `${FRONTEND_URL}/products/medusa/mint-vest-accessories`;
    const productResponse = await fetch(productUrl);

    if (productResponse.ok) {
      const html = await productResponse.text();
      const hasAddToCart = html.includes('Add to Cart') || html.includes('add-to-cart');
      const hasProduct = html.includes('Mint') || html.includes('vest');

      if (hasAddToCart && hasProduct) {
        success(`Product page loads correctly at: ${productUrl}`);
        return true;
      } else {
        error('Product page missing key elements');
        if (!hasAddToCart) error('  - No Add to Cart button found');
        if (!hasProduct) error('  - Product details not found');
        return false;
      }
    } else {
      error(`Product page returned ${productResponse.status}`);
      return false;
    }
  } catch (err) {
    error(`Navigation test failed: ${err.message}`);
    return false;
  }
}

async function testCartFunctionality() {
  section('2. TESTING CART FUNCTIONALITY');

  try {
    // Create a cart
    info('Creating a new cart...');
    const cartResponse = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      },
      body: JSON.stringify({
        region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
      })
    });

    if (!cartResponse.ok) {
      error(`Failed to create cart: ${cartResponse.status}`);
      return false;
    }

    const { cart } = await cartResponse.json();
    success(`Cart created with ID: ${cart.id}`);

    // Get a product to add
    info('Fetching product to add to cart...');
    const productsResponse = await fetch(`${MEDUSA_URL}/store/products?limit=1`, {
      headers: {
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      }
    });

    const { products } = await productsResponse.json();
    if (!products || products.length === 0) {
      error('No products available to test');
      return false;
    }

    const testProduct = products[0];
    const testVariant = testProduct.variants?.[0];

    if (!testVariant) {
      error('Product has no variants');
      return false;
    }

    info(`Adding "${testProduct.title}" to cart...`);

    // Add to cart
    const addResponse = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      },
      body: JSON.stringify({
        variant_id: testVariant.id,
        quantity: 1
      })
    });

    if (addResponse.ok) {
      const updatedCart = await addResponse.json();
      const itemCount = updatedCart.cart?.items?.length || 0;

      if (itemCount > 0) {
        success(`Product added to cart! Cart now has ${itemCount} item(s)`);

        // Display cart summary
        const item = updatedCart.cart.items[0];
        info(`  Product: ${item.title}`);
        info(`  Quantity: ${item.quantity}`);
        info(`  Price: $${(item.unit_price / 100).toFixed(2)}`);

        return cart.id;
      } else {
        error('Cart is empty after adding product');
        return false;
      }
    } else {
      error(`Failed to add to cart: ${addResponse.status}`);
      const errorText = await addResponse.text();
      error(`Error: ${errorText}`);
      return false;
    }
  } catch (err) {
    error(`Cart test failed: ${err.message}`);
    return false;
  }
}

async function testCheckoutFlow(cartId) {
  section('3. TESTING CHECKOUT FLOW');

  if (!cartId) {
    error('No cart ID provided, skipping checkout test');
    return false;
  }

  try {
    info('Testing checkout initiation...');

    // Update cart with email
    const emailResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      },
      body: JSON.stringify({
        email: 'test@kctmenswear.com'
      })
    });

    if (emailResponse.ok) {
      success('Cart updated with customer email');
    } else {
      error('Failed to update cart with email');
    }

    // Test checkout page loads
    info('Testing checkout page...');
    const checkoutUrl = `${FRONTEND_URL}/checkout`;
    const checkoutResponse = await fetch(checkoutUrl);

    if (checkoutResponse.ok) {
      success(`Checkout page loads at: ${checkoutUrl}`);
      return true;
    } else {
      error(`Checkout page returned ${checkoutResponse.status}`);
      return false;
    }
  } catch (err) {
    error(`Checkout test failed: ${err.message}`);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('\n🚀 KCT MENSWEAR E2E TEST SUITE', colors.bright + colors.magenta);
  console.log('='.repeat(60));

  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Navigation
  const navPassed = await testProductNavigation();
  if (navPassed) passedTests++; else failedTests++;

  // Test 2: Cart
  const cartId = await testCartFunctionality();
  if (cartId) passedTests++; else failedTests++;

  // Test 3: Checkout
  const checkoutPassed = await testCheckoutFlow(cartId);
  if (checkoutPassed) passedTests++; else failedTests++;

  // Summary
  section('TEST SUMMARY');
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log(`Tests completed in ${duration} seconds`, colors.dim);
  success(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    error(`Failed: ${failedTests}`);
  }

  const percentage = ((passedTests / (passedTests + failedTests)) * 100).toFixed(0);

  if (failedTests === 0) {
    log('\n✨ ALL TESTS PASSED! ✨', colors.bright + colors.green);
    log('The site is functioning as a professional menswear brand!', colors.green);
  } else {
    log(`\n⚠️  ${percentage}% tests passing`, colors.yellow);
    log('Some features need attention before going live.', colors.yellow);
  }

  // Recommendations
  section('RECOMMENDATIONS');

  if (!navPassed) {
    info('1. Fix product navigation - ensure handles are present');
    info('   - Check that products have handles in Medusa admin');
    info('   - Verify routing in Next.js app');
  }

  if (!cartId) {
    info('2. Fix cart functionality');
    info('   - Ensure cart API endpoints are working');
    info('   - Check variant IDs are valid');
  }

  if (!checkoutPassed) {
    info('3. Complete checkout flow implementation');
    info('   - Set up Stripe payment processing');
    info('   - Configure shipping options');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the tests
runAllTests();