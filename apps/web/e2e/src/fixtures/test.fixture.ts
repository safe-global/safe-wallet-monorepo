/**
 * Central Playwright fixture file.
 *
 * Extends base test with:
 * - safePage: a Page pre-seeded with localStorage (cookie consent, terms, etc.)
 * - safeApiClient: the Safe Client Gateway API client
 *
 * CI debuggability: on failure, automatically attaches console errors,
 * console warnings, failed network requests, page URL, test data identifiers,
 * and environment info to the test report.
 *
 * Rule: Every test imports { test, expect } from here, never from @playwright/test directly.
 */
import { test as base, expect, type Page, type TestInfo } from '@playwright/test'
import { SafeApiClient } from '../api/safe-api-client'
import { LS_KEYS, STAGING_CGW_URL } from '../data/constants'

// Cookie consent state — mirrors Cypress localstorage_data.js
const COOKIE_STATE = JSON.stringify({
  necessary: true,
  updates: true,
  analytics: true,
  terms: true,
  termsVersion: undefined, // Will be set dynamically if needed
})

/**
 * Seeds localStorage with required consent/dismissal values via addInitScript.
 * This runs before page scripts on every navigation — no extra goto() needed.
 * Prevents popups and modals from blocking test flows.
 * Mirrors: cypress/support/e2e.js beforeEach()
 */
async function seedLocalStorage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ cookiesKey, safeLabsKey, outreachKey, cookieState }) => {
      // Cookie + terms consent
      window.localStorage.setItem(cookiesKey, cookieState)
      window.localStorage.setItem(safeLabsKey, 'true')

      // Suppress outreach popup
      window.sessionStorage.setItem(outreachKey, String(Date.now()))

      // Suppress Beamer (product updates widget)
      const beamerKeys = Object.keys(window.localStorage).filter((k) => k.startsWith('_BEAMER'))
      if (beamerKeys.length === 0) {
        // Pre-seed with current date to suppress first-visit banner
        const now = new Date().toISOString()
        window.localStorage.setItem('_BEAMER_FIRST_VISIT_', now)
        window.localStorage.setItem('_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_', now)
      }
    },
    {
      cookiesKey: LS_KEYS.cookiesTerms,
      safeLabsKey: LS_KEYS.safeLabsTerms,
      outreachKey: 'SAFE_v2__outreachPopup_session_v2',
      cookieState: COOKIE_STATE,
    },
  )
}

// ---------------------------------------------------------------------------
// CI debuggability — collect failure evidence
// ---------------------------------------------------------------------------

/** Collects console errors during the test */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    errors.push(`[pageerror] ${err.message}`)
  })
  return errors
}

/** Collects console warnings during the test */
function collectConsoleWarnings(page: Page): string[] {
  const warnings: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'warning') {
      warnings.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  return warnings
}

/** Collects failed network requests (4xx/5xx) during the test */
function collectFailedRequests(page: Page): string[] {
  const failures: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failures.push(`${response.status()} ${response.request().method()} ${response.url()}`)
    }
  })
  return failures
}

/** Attaches failure evidence to the test report */
async function attachFailureEvidence(
  testInfo: TestInfo,
  page: Page,
  consoleErrors: string[],
  consoleWarnings: string[],
  failedRequests: string[],
): Promise<void> {
  if (testInfo.status === 'passed') return

  // Page URL at failure — the single most useful debug signal
  await testInfo.attach('page-url-on-failure', {
    body: page.url(),
    contentType: 'text/plain',
  })

  // Console errors
  if (consoleErrors.length > 0) {
    await testInfo.attach('console-errors', {
      body: consoleErrors.join('\n'),
      contentType: 'text/plain',
    })
  }

  // Console warnings (React prop warnings, deprecation notices, hydration issues)
  if (consoleWarnings.length > 0) {
    await testInfo.attach('console-warnings', {
      body: consoleWarnings.join('\n'),
      contentType: 'text/plain',
    })
  }

  // Failed network requests
  if (failedRequests.length > 0) {
    await testInfo.attach('failed-network-requests', {
      body: failedRequests.join('\n'),
      contentType: 'text/plain',
    })
  }

  // Environment information
  const envInfo = [
    `baseURL: ${testInfo.project.use.baseURL || 'not set'}`,
    `CI: ${process.env.CI || 'false'}`,
    `CGW: ${process.env.SAFE_CGW_BASE_URL || STAGING_CGW_URL}`,
    `browser: ${testInfo.project.name}`,
    `retries: ${testInfo.retry}/${testInfo.project.retries}`,
    `worker: ${testInfo.workerIndex}`,
  ].join('\n')
  await testInfo.attach('environment-info', {
    body: envInfo,
    contentType: 'text/plain',
  })

  // Test data identifiers — extract Safe address from test URL if present
  const safeAnnotation = testInfo.annotations.find((a) => a.type === 'safe-address')?.description
  if (safeAnnotation) {
    await testInfo.attach('test-data', {
      body: `Safe address: ${safeAnnotation}`,
      contentType: 'text/plain',
    })
  }
}

// ---------------------------------------------------------------------------
// Fixture type declaration
// ---------------------------------------------------------------------------
type SafeFixtures = {
  /** Page with localStorage pre-seeded (consent, terms, popups dismissed) */
  safePage: Page
  /** Safe Client Gateway API client — use for API-first test setup */
  safeApiClient: SafeApiClient
}

// ---------------------------------------------------------------------------
// Extended test with Safe-specific fixtures
// ---------------------------------------------------------------------------
export const test = base.extend<SafeFixtures>({
  safePage: async ({ page }, use, testInfo) => {
    // Start collecting failure evidence before the test runs
    const consoleErrors = collectConsoleErrors(page)
    const consoleWarnings = collectConsoleWarnings(page)
    const failedRequests = collectFailedRequests(page)

    // Seed localStorage via addInitScript — runs before page scripts, no extra navigation
    await seedLocalStorage(page)
    await use(page)

    // After test: attach evidence if it failed
    await attachFailureEvidence(testInfo, page, consoleErrors, consoleWarnings, failedRequests)
  },

  safeApiClient: async ({}, use) => {
    const client = new SafeApiClient()
    await use(client)
  },
})

// Re-export expect so tests only need one import
export { expect }
