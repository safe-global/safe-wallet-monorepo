import { defineConfig, devices } from '@playwright/test'
import { OIDC_STORAGE_STATE } from './src/data/step-up-paths'

export default defineConfig({
  testDir: './tests/step-up-live',
  timeout: 8 * 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: './reports/step-up-live', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://safe-wallet-web.dev.5afe.dev',
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    timezoneId: 'UTC',
    video: { mode: 'on', size: { width: 1400, height: 900 } },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'login', testMatch: /login\.setup\.ts/ },
    {
      name: 'flows',
      testMatch: /\.spec\.ts/,
      dependencies: ['login'],
      use: { storageState: OIDC_STORAGE_STATE },
    },
  ],
  outputDir: './test-results/step-up-live',
})
