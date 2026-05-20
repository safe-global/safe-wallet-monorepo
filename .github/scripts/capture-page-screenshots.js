/**
 * Capture screenshots of web app pages using Playwright
 *
 * This script reads route URLs and captures screenshots of each page
 */

const fs = require('fs')
const path = require('path')

// Playwright is installed into an isolated directory outside the workspace by
// the build workflow. Resolve by absolute path so a stray local `node_modules`
// can never shadow the pinned install.
const playwrightPath = process.env.PLAYWRIGHT_PATH
if (!playwrightPath) {
  console.error('PLAYWRIGHT_PATH env var is required')
  process.exit(1)
}
const { chromium } = require(playwrightPath)

// LocalStorage values to dismiss modals/banners (from Cypress e2e setup)
const COOKIE_CONSENT = JSON.stringify({
  necessary: true,
  updates: true,
  analytics: true,
  terms: true,
  termsVersion: '1.1',
})

async function capturePageScreenshots() {
  // Read routes file
  const routesFile = 'page-screenshots/routes.json'
  if (!fs.existsSync(routesFile)) {
    console.log('No routes file found')
    return
  }

  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf-8'))

  if (routes.length === 0) {
    console.log('No routes to capture')
    return
  }

  console.log(`Capturing ${routes.length} page screenshots...`)

  // Launch browser
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Ignore HTTPS errors for preview deployments
    ignoreHTTPSErrors: true,
  })

  // Set a longer default timeout
  context.setDefaultTimeout(60000)

  // Add script to set localStorage before page loads to dismiss modals
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
    // Dismiss outreach popup
    sessionStorage.setItem('SAFE_v2__outreachPopup_session_v2', Date.now().toString())
  })

  const page = await context.newPage()

  // Capture each route. Filenames follow the strict convention
  // `<routeSlug>__<viewport>.png` where routeSlug matches [a-z0-9_]+ and
  // viewport is `desktop` or `mobile`. The publish workflow validates this
  // shape and rejects anything that doesn't match.
  for (let i = 0; i < routes.length; i++) {
    const { url, route, name, waitForSelector } = routes[i]
    const routeSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if (!routeSlug) {
      console.log(`[${i + 1}/${routes.length}] Skipping: empty slug for "${name}"`)
      continue
    }
    const screenshotName = `${routeSlug}__desktop`
    console.log(`[${i + 1}/${routes.length}] Capturing: ${name} (${route})`)

    try {
      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      // Wait for specific selector if configured
      if (waitForSelector) {
        try {
          await page.locator(waitForSelector).first().waitFor({
            state: 'visible',
            timeout: 15000,
          })
          console.log(`  Found selector: ${waitForSelector}`)
        } catch (error) {
          console.log(`  Selector not found: ${waitForSelector}, continuing anyway`)
        }
      }

      // Wait for network to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('  Network not fully idle, continuing')
      })

      // Additional wait for any lazy-loaded content
      await page.waitForTimeout(2000)

      // Take screenshot
      const screenshotPath = path.join('page-screenshots', `${screenshotName}.png`)

      await page.screenshot({
        path: screenshotPath,
        fullPage: false, // Viewport only for consistency
        animations: 'disabled',
      })

      console.log(`  Saved: ${screenshotPath}`)
    } catch (error) {
      console.error(`  Error capturing ${name}:`, error.message)

      // Try to capture error screenshot
      try {
        // Error screenshots use the same convention so they pass the
        // publish-side filename validation. Suffix the slug, not the viewport.
        const errorPath = path.join('page-screenshots', `${routeSlug}_error__desktop.png`)
        // Viewport-only to stay within the publish-side size cap.
        await page.screenshot({ path: errorPath, fullPage: false })
        console.log(`  Error screenshot saved: ${errorPath}`)
      } catch (screenshotError) {
        console.error('  Could not capture error screenshot:', screenshotError.message)
      }
    }
  }

  await browser.close()
  console.log('\nScreenshot capture complete!')
}

capturePageScreenshots().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
