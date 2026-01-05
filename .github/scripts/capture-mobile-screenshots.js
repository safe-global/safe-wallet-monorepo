/**
 * Capture screenshots of Mobile Storybook stories using Playwright
 *
 * This script serves the built Storybook locally and captures screenshots
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const { chromium } = require('playwright')

// Simple static file server
function createServer(staticDir, port) {
  const resolvedStaticDir = path.resolve(staticDir)

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Parse URL and remove query string
      const urlPath = (req.url || '/').split('?')[0]

      // Resolve the file path and ensure it stays within staticDir (prevent path traversal)
      const requestedPath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
      let filePath = path.join(resolvedStaticDir, requestedPath === '/' ? 'index.html' : requestedPath)
      filePath = path.resolve(filePath)

      // Security: Ensure the resolved path is within the static directory
      if (!filePath.startsWith(resolvedStaticDir)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      const extname = path.extname(filePath)
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      }

      const contentType = contentTypes[extname] || 'application/octet-stream'
      // Text-based content types that should use utf-8 encoding
      const textTypes = ['.html', '.js', '.css', '.json', '.svg']
      const isTextContent = textTypes.includes(extname)

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            // Try index.html for SPA routing
            fs.readFile(path.join(resolvedStaticDir, 'index.html'), (err, indexContent) => {
              if (err) {
                res.writeHead(404)
                res.end('Not Found')
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(indexContent, 'utf-8')
              }
            })
          } else {
            res.writeHead(500)
            res.end(`Server Error: ${error.code}`)
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType })
          // Only use utf-8 encoding for text content, not binary files
          if (isTextContent) {
            res.end(content, 'utf-8')
          } else {
            res.end(content)
          }
        }
      })
    })

    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`)
      resolve(server)
    })
  })
}

async function captureScreenshots() {
  const storyUrlsFile = 'mobile-screenshots/story-urls.json'
  if (!fs.existsSync(storyUrlsFile)) {
    console.log('No story URLs file found')
    return
  }

  const storyUrls = JSON.parse(fs.readFileSync(storyUrlsFile, 'utf-8'))

  if (storyUrls.length === 0) {
    console.log('No story URLs to capture')
    return
  }

  // Start local server for built Storybook
  const storybookDir = path.join(process.cwd(), 'apps/mobile/storybook-static')
  if (!fs.existsSync(storybookDir)) {
    console.error('Storybook build not found at:', storybookDir)
    process.exit(1)
  }

  const server = await createServer(storybookDir, 6006)

  console.log(`Capturing ${storyUrls.length} screenshots...`)

  const browser = await chromium.launch()
  // Use mobile viewport for more authentic screenshots
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
  })
  const page = await context.newPage()

  for (let i = 0; i < storyUrls.length; i++) {
    const { url, componentName, storyName } = storyUrls[i]
    console.log(`[${i + 1}/${storyUrls.length}] Capturing: ${componentName} - ${storyName}`)

    const cleanComponentName = componentName.replace(/[/\\]/g, '-').replace(/\s+/g, '')
    const modes = ['light', 'dark']

    for (const mode of modes) {
      try {
        // Add theme global parameter to URL
        const separator = url.includes('?') ? '&' : '?'
        const modeUrl = `${url}${separator}globals=theme:${mode}`

        console.log(`  📸 Capturing ${mode} mode...`)
        await page.goto(modeUrl, {
          waitUntil: 'networkidle',
          timeout: 30000,
        })

        // Check if we're on iframe.html (direct story view) or the main Storybook page
        const isDirectIframe = url.includes('iframe.html')
        let targetPage = page

        if (!isDirectIframe) {
          // We're on the main Storybook page with iframe wrapper
          const iframeElement = await page.waitForSelector('iframe#storybook-preview-iframe', { timeout: 10000 })
          const frame = await iframeElement.contentFrame()

          if (!frame) {
            throw new Error('Could not access Storybook iframe')
          }

          await frame.waitForLoadState('load', { timeout: 10000 })
          targetPage = frame
        }

        // Additional wait for React Native Web to render
        await page.waitForTimeout(3000)

        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
          console.log(`    ⚠ Network not fully idle, continuing anyway`)
        })

        const screenshotPath = path.join('mobile-screenshots', `${cleanComponentName}--${storyName}--${mode}.png`)

        // Try to find the story content - React Native Web may render in different containers
        // Priority: #storybook-root, body > div, or fallback to body
        let screenshotTarget = null
        const storyRoot = targetPage.locator('#storybook-root').first()
        const bodyContent = targetPage.locator('body > div').first()

        if ((await storyRoot.count()) > 0) {
          const rootContent = await targetPage.locator('#storybook-root > *').first()
          if ((await rootContent.count()) > 0) {
            screenshotTarget = storyRoot
            console.log(`    Using #storybook-root`)
          }
        }

        if (!screenshotTarget && (await bodyContent.count()) > 0) {
          screenshotTarget = bodyContent
          console.log(`    Using body > div`)
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
        console.error(`    ✗ Error capturing ${mode} mode for ${componentName} - ${storyName}:`, error.message)

        try {
          const errorPath = path.join('mobile-screenshots', `${cleanComponentName}--${storyName}--${mode}-ERROR.png`)
          await page.screenshot({ path: errorPath, fullPage: true })
          console.log(`    ⚠ Error screenshot saved: ${errorPath}`)
        } catch (screenshotError) {
          console.error(`    ✗ Could not capture error screenshot:`, screenshotError.message)
        }
      }
    }
  }

  await browser.close()
  server.close()
  console.log('\n✓ Mobile screenshot capture complete!')
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
