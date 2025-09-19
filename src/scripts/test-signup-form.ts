import puppeteer from 'puppeteer'

async function testSignupForm() {
  console.log('🧪 Testing KCT Menswear Signup Form with Native Checkbox\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  })

  try {
    const page = await browser.newPage()

    // Navigate to signup page
    console.log('1. Navigating to signup page...')
    await page.goto('https://kct-menswear-medusa-test.vercel.app/auth/signup', {
      waitUntil: 'networkidle2'
    })

    // Wait for form to load
    await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 })

    // Check initial state
    console.log('2. Checking initial button state...')
    const initialButtonDisabled = await page.$eval('button[type="submit"]',
      (button) => button.disabled
    )
    console.log(`   - Create Account button disabled: ${initialButtonDisabled} ✅`)

    // Fill in form fields
    console.log('3. Filling in form fields...')
    const timestamp = Date.now()
    await page.type('input[name="first_name"]', 'Test')
    await page.type('input[name="last_name"]', 'User')
    await page.type('input[name="email"]', `test${timestamp}@example.com`)
    await page.type('input[name="password"]', 'TestPassword123!')
    await page.type('input[name="confirmPassword"]', 'TestPassword123!')

    // Check button is still disabled (terms not accepted)
    const beforeCheckboxDisabled = await page.$eval('button[type="submit"]',
      (button) => button.disabled
    )
    console.log(`4. Button disabled before checkbox: ${beforeCheckboxDisabled} ✅`)

    // Click the native checkbox
    console.log('5. Clicking native checkbox...')
    await page.click('input[type="checkbox"]#terms')

    // Wait a moment for state update
    await page.waitForTimeout(100)

    // Check if checkbox is checked
    const isChecked = await page.$eval('input[type="checkbox"]#terms',
      (checkbox: HTMLInputElement) => checkbox.checked
    )
    console.log(`   - Checkbox checked: ${isChecked} ${isChecked ? '✅' : '❌'}`)

    // Check if button is now enabled
    const afterCheckboxDisabled = await page.$eval('button[type="submit"]',
      (button) => button.disabled
    )
    console.log(`6. Button disabled after checkbox: ${afterCheckboxDisabled} ${!afterCheckboxDisabled ? '✅' : '❌'}`)

    // Test results
    console.log('\n📊 Test Results:')
    if (initialButtonDisabled && !afterCheckboxDisabled && isChecked) {
      console.log('✅ SUCCESS: Native checkbox properly controls button state!')
      console.log('   - Button starts disabled')
      console.log('   - Checkbox click enables button')
      console.log('   - State binding is working correctly')
    } else {
      console.log('❌ FAILURE: Issues detected:')
      if (!initialButtonDisabled) console.log('   - Button should start disabled')
      if (afterCheckboxDisabled) console.log('   - Button should be enabled after checkbox')
      if (!isChecked) console.log('   - Checkbox should be checked')
    }

    // Keep browser open for manual inspection
    console.log('\n👀 Browser window left open for manual inspection')
    console.log('   Close the browser window when done.')

  } catch (error) {
    console.error('❌ Test failed:', error)
    await browser.close()
  }
}

// Check if puppeteer is installed
import { execSync } from 'child_process'
try {
  require.resolve('puppeteer')
  testSignupForm()
} catch {
  console.log('Installing puppeteer...')
  execSync('npm install puppeteer', { stdio: 'inherit' })
  testSignupForm()
}