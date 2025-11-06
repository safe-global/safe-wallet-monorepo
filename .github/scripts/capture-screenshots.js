/**
 * Capture screenshots of Storybook stories using Playwright
 *
 * This script reads story URLs and captures screenshots of each story
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  // Read story URLs
  const storyUrlsFile = 'screenshots/story-urls.json';
  if (!fs.existsSync(storyUrlsFile)) {
    console.log('No story URLs file found');
    return;
  }

  const storyUrls = JSON.parse(fs.readFileSync(storyUrlsFile, 'utf-8'));

  if (storyUrls.length === 0) {
    console.log('No story URLs to capture');
    return;
  }

  console.log(`Capturing ${storyUrls.length} screenshots...`);

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Capture each story
  for (let i = 0; i < storyUrls.length; i++) {
    const { url, componentName, storyName } = storyUrls[i];
    console.log(`[${i + 1}/${storyUrls.length}] Capturing: ${componentName} - ${storyName}`);

    try {
      // Navigate to story
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for story to render
      await page.waitForTimeout(2000);

      // Find the story root element
      const storyRoot = await page.locator('#storybook-root').first();

      // Take screenshot
      const screenshotPath = path.join(
        'screenshots',
        `${componentName}--${storyName}.png`
      );

      if (await storyRoot.count() > 0) {
        await storyRoot.screenshot({
          path: screenshotPath,
          animations: 'disabled',
        });
        console.log(`  ✓ Saved: ${screenshotPath}`);
      } else {
        // Fallback to full page screenshot
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          animations: 'disabled',
        });
        console.log(`  ✓ Saved (full page): ${screenshotPath}`);
      }
    } catch (error) {
      console.error(`  ✗ Error capturing ${componentName} - ${storyName}:`, error.message);

      // Try to capture error screenshot
      try {
        const errorPath = path.join(
          'screenshots',
          `${componentName}--${storyName}-ERROR.png`
        );
        await page.screenshot({ path: errorPath, fullPage: true });
        console.log(`  ⚠ Error screenshot saved: ${errorPath}`);
      } catch (screenshotError) {
        console.error('  ✗ Could not capture error screenshot:', screenshotError.message);
      }
    }
  }

  await browser.close();
  console.log('\n✓ Screenshot capture complete!');
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
