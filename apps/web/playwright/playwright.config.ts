import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (isCI ? 'http://localhost:8080' : 'http://localhost:3000')

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? undefined : 1,
  reporter: [
    ['html', { outputFolder: './reports/html', open: isCI ? 'never' : 'on-failure' }],
    ...(isCI ? [['list'] as const, ['junit', { outputFile: './reports/junit/results.xml' }] as const] : []),
  ],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    timezoneId: 'UTC',
    // Note: Safe Wallet keeps WebSocket connections open, so waitUntil: 'load'
    // never resolves. All navigation uses safeGoto() from src/utils/navigation.ts
    // which passes waitUntil: 'commit' per-call.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: './test-results',
  ...(isCI
    ? {
        webServer: {
          command: 'npx serve out -p 8080',
          port: 8080,
          timeout: 120_000,
          reuseExistingServer: false,
          cwd: '../',
        },
      }
    : {}),
})
