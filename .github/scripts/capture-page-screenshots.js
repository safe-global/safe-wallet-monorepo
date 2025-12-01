/**
 * Capture screenshots of web app pages using Playwright
 *
 * This script reads route URLs and captures screenshots of each page
 */

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

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

  const page = await context.newPage()

  // Dismiss any cookie banners or modals that might appear
  async function dismissOverlays() {
    try {
      // Common cookie banner selectors
      const cookieSelectors = [
        '[data-testid="cookie-banner-accept"]',
        '[data-testid="accept-cookies"]',
        'button:has-text("Accept")',
        '[class*="cookie"] button:has-text("Accept")',
      ]

      for (const selector of cookieSelectors) {
        const button = await page.locator(selector).first()
        if ((await button.count()) > 0 && (await button.isVisible())) {
          await button.click()
          console.log('  Dismissed cookie banner')
          break
        }
      }

      // Wait a bit for any animations
      await page.waitForTimeout(500)
    } catch (error) {
      // Ignore errors - overlays might not exist
    }
  }

  // Capture each route
  for (let i = 0; i < routes.length; i++) {
    const { url, route, name, waitForSelector } = routes[i]
    const screenshotName = name.replace(/\s+/g, '-').toLowerCase()
    console.log(`[${i + 1}/${routes.length}] Capturing: ${name} (${route})`)

    try {
      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      // Dismiss any overlays on first page load
      if (i === 0) {
        await dismissOverlays()
      }

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
        const errorPath = path.join('page-screenshots', `${screenshotName}-ERROR.png`)
        await page.screenshot({ path: errorPath, fullPage: true })
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
