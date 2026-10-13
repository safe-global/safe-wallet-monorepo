import { defineConfig, devices } from '@playwright/test'
import { playwrightSpecs } from './environment/playwright-specs.mjs'

// Started by `yarn e2e:env playwright`, which sets these values from the running stack.
const baseURL = process.env.PLAYWRIGHT_BASE_URL
if (process.env.SAFE_E2E_ISOLATED !== 'true' || !baseURL) {
  throw new Error('Run the isolated Playwright specs with `yarn workspace @safe-global/web e2e:env playwright`')
}

const artifacts = './environment/artifacts/playwright'

export default defineConfig({
  testDir: './tests',
  testMatch: Object.keys(playwrightSpecs).map((spec) => `**/tests/${spec}`),
  timeout: 120_000,
  expect: { timeout: 30_000 },
  // The tests of a file share the data its scenarios prepare once, so a file stays in one worker.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Every spec file gets its own owners and Safes, so workers share the stack safely.
  workers: Number(process.env.SAFE_E2E_WORKERS || 2),
  reporter: [
    ['list'],
    ['html', { outputFolder: `${artifacts}/html`, open: 'never' }],
    ['junit', { outputFile: `${artifacts}/junit.xml` }],
  ],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The full Chromium build, which CI installs without the headless shell.
        channel: 'chromium',
        launchOptions: { args: ['--host-resolver-rules=MAP *.safe-e2e.test 127.0.0.1'] },
      },
    },
  ],
  outputDir: `${artifacts}/results`,
})
