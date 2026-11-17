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
import { LS_KEYS } from '../data/constants'
import { WalletPage } from '../pages/wallet.page'
import { specData, type Owners, type Safes } from './spec-data'
import { version as TERMS_VERSION } from '@/markdown/terms/version'

// Cookie consent state.
// `hasAcceptedTerms` only treats consent as valid when `termsVersion` matches
// the app's current terms version, so seeding `undefined` left the banner open.
// Seed the real version so the banner stays suppressed.
const COOKIE_STATE = JSON.stringify({
  necessary: true,
  updates: true,
  analytics: true,
  terms: true,
  termsVersion: TERMS_VERSION,
})

/**
 * Seeds localStorage with required consent/dismissal values via addInitScript.
 * This runs before page scripts on every navigation — no extra goto() needed.
 * Prevents popups and modals from blocking test flows.
 */
export async function seedLocalStorage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ cookiesKey, safeLabsKey, outreachKey, stakingBannerKey, cookieState }) => {
      // Cookie + terms consent
      window.localStorage.setItem(cookiesKey, cookieState)
      window.localStorage.setItem(safeLabsKey, 'true')

      // Suppress outreach popup
      window.sessionStorage.setItem(outreachKey, String(Date.now()))

      // The staking promo banner appears once balances load and moves the controls below it
      window.localStorage.setItem(stakingBannerKey, 'true')

      // Suppress Beamer (product updates widget).
      // KNOWN GAP: Beamer reads these keys suffixed with its PRODUCT_ID, so these unsuffixed
      // writes are likely inert; `updates: false` in COOKIE_STATE would keep Beamer from loading.
      const beamerKeys = Object.keys(window.localStorage).filter((k) => k.startsWith('_BEAMER'))
      if (beamerKeys.length === 0) {
        const now = new Date().toISOString()
        window.localStorage.setItem('_BEAMER_FIRST_VISIT_', now)
        window.localStorage.setItem('_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_', now)
      }
    },
    {
      cookiesKey: LS_KEYS.cookiesTerms,
      safeLabsKey: LS_KEYS.safeLabsTerms,
      outreachKey: 'SAFE_v2__outreachPopup_session_v2',
      stakingBannerKey: LS_KEYS.stakingPromoBannerHidden,
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
    `CGW: ${process.env.SAFE_CGW_BASE_URL || 'not set'}`,
    `browser: ${testInfo.project.name}`,
    `retries: ${testInfo.retry}/${testInfo.project.retries}`,
    `worker: ${testInfo.workerIndex}`,
  ].join('\n')
  await testInfo.attach('environment-info', {
    body: envInfo,
    contentType: 'text/plain',
  })

  // Test data identifiers: the Safes the test recorded
  const safeAddresses = testInfo.annotations.filter((a) => a.type === 'safe-address').map((a) => a.description)
  if (safeAddresses.length > 0) {
    await testInfo.attach('test-data', {
      body: safeAddresses.map((address) => `Safe address: ${address}`).join('\n'),
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
  /** Wallet page object — connect a private-key wallet and SiWE login */
  walletPage: WalletPage
  /** The four owners of the spec's scenarios: Alice, Bob, Carol and Dave */
  owners: Owners
  /** The Safes that the spec's scenarios deployed, by the names they return */
  safes: Safes
}

// Scenarios deploy and index Safes before the first test of a spec file.
const SPEC_DATA_TIMEOUT_MS = 600_000

// ---------------------------------------------------------------------------
// Extended test with Safe-specific fixtures
// ---------------------------------------------------------------------------
export const test = base.extend<SafeFixtures>({
  // Not `use`: the React hooks lint rule takes that name for a hook.
  safePage: async ({ page }, provide, testInfo) => {
    // Start collecting failure evidence before the test runs
    const consoleErrors = collectConsoleErrors(page)
    const consoleWarnings = collectConsoleWarnings(page)
    const failedRequests = collectFailedRequests(page)

    // Seed localStorage via addInitScript — runs before page scripts, no extra navigation
    await seedLocalStorage(page)
    await provide(page)

    // After test: attach evidence if it failed
    await attachFailureEvidence(testInfo, page, consoleErrors, consoleWarnings, failedRequests)
  },

  safeApiClient: async ({}, provide) => {
    const client = new SafeApiClient()
    await provide(client)
  },

  walletPage: async ({ safePage }, provide) => {
    await provide(new WalletPage(safePage))
  },

  owners: [
    async ({}, provide, testInfo) => {
      await provide((await specData(testInfo)).owners)
    },
    { timeout: SPEC_DATA_TIMEOUT_MS },
  ],

  safes: [
    async ({}, provide, testInfo) => {
      await provide((await specData(testInfo)).safes)
    },
    { timeout: SPEC_DATA_TIMEOUT_MS },
  ],
})

// Re-export expect so tests only need one import
export { expect }
