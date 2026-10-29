import { defineConfig, devices } from '@playwright/test'
import { playwrightSpecs } from './environment/playwright-specs.mjs'

// Started by `yarn e2e:env playwright`, which sets these values from the running stack.
const baseURL = process.env.PLAYWRIGHT_BASE_URL
if (process.env.SAFE_E2E_ISOLATED !== 'true' || !baseURL) {
  throw new Error('Run the isolated Playwright specs with `yarn workspace @safe-global/web e2e:env playwright`')
}

const artifacts = './environment/artifacts/playwright'
const auth0MockPort = process.env.AUTH0_MOCK_PORT || '8443'

export default defineConfig({
  testDir: './tests',
  testMatch: Object.keys(playwrightSpecs).map((spec) => `**/tests/${spec}`),
  // The stack polls every 2 s and indexes every 1 s, so a step that waits longer has failed.
  // Polls fixed in code, e.g. useActivatingPolicies (15 s), need their own longer step timeout.
  timeout: 90_000,
  expect: { timeout: 20_000 },
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
    actionTimeout: 20_000,
    navigationTimeout: 20_000,
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The local HTTPS mocks (Auth0, CoW) share a self-signed certificate.
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The full Chromium build, which CI installs without the headless shell.
        channel: 'chromium',
        launchOptions: {
          // The gateway sends browsers to https://auth.safe-e2e.test (port 443); the mock is published on another port.
          args: [
            `--host-resolver-rules=MAP auth.safe-e2e.test 127.0.0.1:${auth0MockPort}, MAP *.safe-e2e.test 127.0.0.1`,
          ],
        },
      },
    },
  ],
  outputDir: `${artifacts}/results`,
})
