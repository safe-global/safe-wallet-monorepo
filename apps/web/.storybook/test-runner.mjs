import path from 'path'
import { fileURLToPath } from 'url'
import { getStoryContext } from '@storybook/test-runner'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configurable threshold via environment variable (default: 5%)
// Higher threshold to account for rendering differences between CI runs
// Visual tests are most useful for catching major changes, not pixel-perfect matching
const FAILURE_THRESHOLD = parseFloat(process.env.VISUAL_REGRESSION_THRESHOLD || '0.05')

/** @type {import('@storybook/test-runner').TestRunnerConfig} */
const config = {
  setup() {
    // Extend Jest expect with image snapshot matcher
    expect.extend({ toMatchImageSnapshot })
  },

  async postVisit(page, context) {
    // Get story context to check for visual test opt-out
    const storyContext = await getStoryContext(page, context)

    // Skip visual tests if story has `parameters.visualTest.disable: true`
    if (storyContext.parameters?.visualTest?.disable) {
      return
    }

    // Wait for any animations/transitions to complete
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for fonts to load
        if (document.fonts?.ready) {
          document.fonts.ready.then(() => resolve())
        } else {
          resolve()
        }
      })
    })

    // Wait for network to be idle to reduce flakiness
    await page.waitForLoadState('networkidle')

    // Take screenshot
    const screenshot = await page.screenshot()

    // Compare with baseline using jest-image-snapshot
    // Snapshots are stored in a central location for easier CI artifact collection
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: context.id,
      customSnapshotsDir: path.join(__dirname, '..', '__visual_snapshots__'),
      customDiffDir: path.join(__dirname, '..', '__visual_snapshots__', '__diff_output__'),
      failureThreshold: FAILURE_THRESHOLD,
      failureThresholdType: 'percent',
    })
  },
}

export default config
