import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Safe{Wallet} E2E tests.
 *
 * Test categories mirror the existing Cypress structure:
 * - smoke: Fast tests, mocked data OK, runs on every PR
 * - regression: Real data, validates backend through UI
 * - happypath: Real data, full user journeys
 * - visual: Mocked data, Argos screenshots
 * - prodhealthcheck: Real production data
 */
export default defineConfig({
  testDir: './playwright/tests',
  outputDir: './playwright/test-results',

  /* Fail the build on CI if test.only is left in source */
  forbidOnly: !!process.env.CI,

  /* Retries: 3 in CI (matches current Cypress config), 0 locally */
  retries: process.env.CI ? 3 : 0,

  /* Parallel workers: use half CPU cores in CI to avoid memory pressure */
  workers: process.env.CI ? '50%' : undefined,

  /* Test timeout: Playwright's test timeout wraps EVERYTHING (beforeEach + navigation
   * + assertions), unlike Cypress which only times out individual commands.
   * Next.js dev server is slow on first compile — 30s default is not enough.
   * Cypress uses pageLoadTimeout: 60s + defaultCommandTimeout: 10s with no overall cap.
   * We set 60s locally, 90s in CI (retries hit cold pages). */
  timeout: process.env.CI ? 90_000 : 60_000,

  /* Reporter configuration — keep all Playwright output inside ./playwright/ */
  reporter: process.env.CI
    ? [
        ['html', { open: 'never', outputFolder: './playwright/playwright-report' }],
        ['junit', { outputFile: './playwright/test-results/junit-report.xml' }],
      ]
    : [['html', { open: 'on-failure', outputFolder: './playwright/playwright-report' }]],

  /* Shared settings for all projects */
  use: {
    /* Base URL — matches Cypress config */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Screenshots on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry — gives full context without slowing passing tests */
    video: 'on-first-retry',

    /* Trace on first retry — DOM snapshots, network, console */
    trace: 'on-first-retry',

    /* Timeouts matching Cypress config */
    actionTimeout: 10_000,
    navigationTimeout: 60_000,

    /* Locale override — matches Cypress e2e.js Emulation.setLocaleOverride */
    locale: 'en-US',
    timezoneId: 'UTC',
  },

  /* Expect timeout: how long auto-retrying assertions (toBeVisible, toHaveText, etc.)
   * wait before failing. Default is 5s — too short when API responses take up to 60s.
   * Matches Cypress defaultCommandTimeout behavior (10s) but increased for slow APIs.
   * Individual tests can override: expect(locator).toBeVisible({ timeout: 90_000 }) */
  expect: {
    timeout: 60_000,
  },

  /* Test projects by category */
  projects: [
    {
      name: 'smoke',
      testDir: './playwright/tests/smoke',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'regression',
      testDir: './playwright/tests/regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'happypath',
      testDir: './playwright/tests/happypath',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'visual',
      testDir: './playwright/tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'prodhealthcheck',
      testDir: './playwright/tests/prodhealthcheck',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        baseURL: 'https://app.safe.global',
      },
    },
  ],

  /* Dev server — start the app before tests if not already running */
  webServer: process.env.CI
    ? {
        command: 'yarn workspace @safe-global/web serve',
        port: 8080,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
})
