/**
 * Capture screenshots of Web Storybook stories using Playwright
 *
 * This script captures screenshots from the deployed Storybook preview
 */

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

async function captureScreenshots() {
  const storyUrlsFile = 'web-storybook-screenshots/story-urls.json'
  if (!fs.existsSync(storyUrlsFile)) {
    console.log('No story URLs file found')
    return
  }

  const storyUrls = JSON.parse(fs.readFileSync(storyUrlsFile, 'utf-8'))

  if (storyUrls.length === 0) {
    console.log('No story URLs to capture')
    return
  }

  console.log(`Capturing ${storyUrls.length} screenshots from deployed Storybook...`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  for (let i = 0; i < storyUrls.length; i++) {
    const { url, componentName, storyName } = storyUrls[i]
    console.log(`[${i + 1}/${storyUrls.length}] Capturing: ${componentName} - ${storyName}`)

    const cleanComponentName = componentName.replace(/[/\\]/g, '-').replace(/\s+/g, '')

    try {
      console.log(`  📸 Loading: ${url}`)
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // Wait for story content to render
      await page.waitForTimeout(2000)

      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        console.log(`    ⚠ Network not fully idle, continuing anyway`)
      })

      const screenshotPath = path.join('web-storybook-screenshots', `${cleanComponentName}--${storyName}.png`)

      // Try to find the story content
      let screenshotTarget = null
      const storyRoot = page.locator('#storybook-root').first()

      if ((await storyRoot.count()) > 0) {
        const rootContent = await page.locator('#storybook-root > *').first()
        if ((await rootContent.count()) > 0) {
          screenshotTarget = storyRoot
          console.log(`    Using #storybook-root`)
        }
      }

      if (screenshotTarget) {
        await screenshotTarget.screenshot({
          path: screenshotPath,
          animations: 'disabled',
        })
        console.log(`    ✓ Saved: ${screenshotPath}`)
      } else {
        // Fallback to full page screenshot
        await page.screenshot({
          path: screenshotPath,
          animations: 'disabled',
          fullPage: true,
        })
        console.log(`    ✓ Saved (full page): ${screenshotPath}`)
      }
    } catch (error) {
      console.error(`    ✗ Error capturing ${componentName} - ${storyName}:`, error.message)

      try {
        const errorPath = path.join('web-storybook-screenshots', `${cleanComponentName}--${storyName}-ERROR.png`)
        await page.screenshot({ path: errorPath, fullPage: true })
        console.log(`    ⚠ Error screenshot saved: ${errorPath}`)
      } catch (screenshotError) {
        console.error(`    ✗ Could not capture error screenshot:`, screenshotError.message)
      }
    }
  }

  await browser.close()
  console.log('\n✓ Web Storybook screenshot capture complete!')
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
