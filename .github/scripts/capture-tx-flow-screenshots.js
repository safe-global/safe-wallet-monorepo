/**
 * Capture screenshots of transaction flow using Playwright
 *
 * This script automates a send token transaction flow:
 * 1. Connects with a private key wallet
 * 2. Initiates New transaction -> Send token -> 5 DAI to vitalik.eth
 * 3. Captures screenshots of review and receipt views
 */

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

// Get private key from environment
const walletCredentials = JSON.parse(process.env.CYPRESS_WALLET_CREDENTIALS || '{}')
const privateKey = walletCredentials.OWNER_4_PRIVATE_KEY

if (!privateKey) {
  console.error('Error: CYPRESS_WALLET_CREDENTIALS not found or missing OWNER_4_PRIVATE_KEY')
  process.exit(1)
}

// Test Safe for screenshots - using a Sepolia test safe where OWNER_4 is an owner
const TEST_SAFE = 'sep:0xbaDd745E0e2738152651185217349A3B0aF415cd'
const BRANCH_NAME = process.env.BRANCH_NAME || ''

// LocalStorage values to dismiss modals/banners
async function setupLocalStorage(context) {
  await context.addInitScript(() => {
    // Accept Safe Labs terms
    localStorage.setItem('SAFE_v2__safe-labs-terms', 'true')
    // Accept cookies
    localStorage.setItem(
      'SAFE_v2__cookies_terms',
      JSON.stringify({
        necessary: true,
        updates: true,
        analytics: true,
        terms: true,
        termsVersion: '1.3',
      }),
    )
    // Token list onboarding
    localStorage.setItem(
      'SAFE_v2__tokenlist_onboarding',
      JSON.stringify({
        1: true,
        11155111: true,
      }),
    )
    // Dismiss outreach popup
    sessionStorage.setItem('SAFE_v2__outreachPopup_session_v2', Date.now().toString())
  })
}

async function connectPrivateKeyWallet(page, privateKey) {
  console.log('Connecting private key wallet...')

  // Wait for the page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

  // Click "Connect wallet" button
  const connectWalletBtn = page.locator('[data-testid="connect-wallet-btn"]').first()
  await connectWalletBtn.waitFor({ state: 'visible', timeout: 15000 })
  await connectWalletBtn.click()

  // Wait for onboard modal and select "Private key" option
  await page.waitForTimeout(2000)

  const onboardShadow = page.locator('onboard-v2')
  await onboardShadow.waitFor({ state: 'attached', timeout: 10000 })

  // Access shadow DOM and click "Private key" button
  const shadowRoot = await onboardShadow.evaluateHandle((el) => el.shadowRoot)
  const privateKeyButton = page.locator('onboard-v2').locator('button:has-text("Private key")')

  // Try to find and click the private key option
  await page.evaluate(() => {
    const onboard = document.querySelector('onboard-v2')
    if (onboard && onboard.shadowRoot) {
      const buttons = onboard.shadowRoot.querySelectorAll('button')
      for (const btn of buttons) {
        if (btn.textContent.includes('Private key')) {
          btn.click()
          return true
        }
      }
    }
    return false
  })

  await page.waitForTimeout(2000)

  // Enter private key
  const pkInput = page.locator('[data-testid="private-key-input"]').locator('input')
  await pkInput.waitFor({ state: 'visible', timeout: 10000 })
  await pkInput.fill(privateKey)

  // Click connect
  const pkConnectBtn = page.locator('[data-testid="pk-connect-btn"]')
  await pkConnectBtn.click()

  // Wait for connection to complete
  await page.waitForTimeout(3000)

  // Close any outreach popup if present
  const outreachCloseBtn = page.locator('[data-testid="close-outreach-popup"]')
  if (await outreachCloseBtn.isVisible().catch(() => false)) {
    await outreachCloseBtn.click()
  }

  console.log('Wallet connected successfully')
}

async function initiateSendTokenFlow(page) {
  console.log('Initiating send token flow using session storage...')

  // Use session storage to pre-fill the transaction flow
  // This is much faster and more reliable than clicking through the UI
  await page.evaluate(() => {
    const mockState = {
      flowType: 'token-transfer',
      step: 1, // Start at review screen (step 1)
      data: {
        recipients: [
          {
            recipient: 'vitalik.eth',
            tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI on Ethereum
            amount: '5',
          },
        ],
        type: 'multiSig',
      },
      timestamp: Date.now(),
    }

    sessionStorage.setItem('txFlowState_v1', JSON.stringify(mockState))
  })

  console.log('Mock transaction state set in session storage')

  // Now open the send tokens flow - it will automatically restore to the review screen
  const newTxBtn = page.locator('[data-testid="new-tx-btn"]').first()
  await newTxBtn.waitFor({ state: 'visible', timeout: 15000 })
  await newTxBtn.click()

  await page.waitForTimeout(1000)

  const sendTokensBtn = page.locator('[data-testid="send-tokens-btn"]')
  await sendTokensBtn.waitFor({ state: 'visible', timeout: 15000 })
  await sendTokensBtn.click()

  // Wait for the flow to restore and render the review screen
  await page.waitForTimeout(3000)

  console.log('Send token flow initiated successfully (auto-restored to review screen)')
}

async function captureTxFlowScreenshots() {
  console.log('Starting transaction flow screenshot capture...')

  // Create output directory
  const outputDir = 'page-screenshots'
  fs.mkdirSync(outputDir, { recursive: true })

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  })

  // Set longer timeout
  context.setDefaultTimeout(60000)

  // Setup localStorage
  await setupLocalStorage(context)

  const page = await context.newPage()

  // Construct URL
  const baseUrl = BRANCH_NAME ? `https://${BRANCH_NAME}--walletweb.review.5afe.dev` : 'http://localhost:3000'

  const url = `${baseUrl}/home?safe=${TEST_SAFE}`

  console.log(`Navigating to: ${url}`)

  try {
    // Navigate to Safe
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })

    await page.waitForTimeout(3000)

    // Connect wallet
    await connectPrivateKeyWallet(page, privateKey)

    // Initiate send token flow
    await initiateSendTokenFlow(page)

    // Wait for review screen to load
    await page.waitForTimeout(3000)

    // SCREENSHOT 1: Review Transaction
    console.log('Capturing review transaction screenshot...')
    const reviewScreenshot = path.join(outputDir, 'tx-flow-review.png')

    // Wait for review content to be visible
    const reviewContent = page.locator('[data-testid="tx-flow-step"]').or(page.locator('form')).first()
    await reviewContent.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

    await page.waitForTimeout(2000)

    await page.screenshot({
      path: reviewScreenshot,
      fullPage: false,
      animations: 'disabled',
    })

    console.log(`Saved: ${reviewScreenshot}`)

    // Execute the transaction (if we can)
    const executeBtn = page
      .locator('[data-testid="execute-form-btn"]')
      .or(page.locator('button').filter({ hasText: /^Execute$|^Submit/ }))
      .first()

    if (await executeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Executing transaction...')
      await executeBtn.click()

      // Wait for transaction to process
      await page.waitForTimeout(5000)

      // SCREENSHOT 2: Transaction Receipt/Status
      console.log('Capturing transaction receipt screenshot...')
      const receiptScreenshot = path.join(outputDir, 'tx-flow-receipt.png')

      // Wait for transaction status or success message
      const txStatus = page
        .locator('[data-testid="transaction-status"]')
        .or(page.locator('[data-testid="finish-transaction-btn"]'))
        .first()
      await txStatus.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})

      await page.waitForTimeout(2000)

      await page.screenshot({
        path: receiptScreenshot,
        fullPage: false,
        animations: 'disabled',
      })

      console.log(`Saved: ${receiptScreenshot}`)
    } else {
      console.log('Execute button not found, skipping receipt screenshot')
    }

    // Write metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      safe: TEST_SAFE,
      flow: 'send-token',
      screenshots: ['tx-flow-review.png', 'tx-flow-receipt.png'],
    }

    fs.writeFileSync(path.join(outputDir, 'tx-flow-metadata.json'), JSON.stringify(metadata, null, 2))

    console.log('\nTransaction flow screenshot capture complete!')
  } catch (error) {
    console.error('Error during screenshot capture:', error)

    // Try to capture error screenshot
    try {
      const errorPath = path.join(outputDir, 'tx-flow-ERROR.png')
      await page.screenshot({ path: errorPath, fullPage: true })
      console.log(`Error screenshot saved: ${errorPath}`)
    } catch (screenshotError) {
      console.error('Could not capture error screenshot:', screenshotError.message)
    }

    throw error
  } finally {
    await browser.close()
  }
}

// Run the script
captureTxFlowScreenshots().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
