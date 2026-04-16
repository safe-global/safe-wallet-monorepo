import { test as base, type Page } from '@playwright/test'
import * as constants from '../data/constants'

/**
 * Base test fixture for Safe{Wallet} E2E tests.
 *
 * Provides a `safePage` that replicates the global setup from Cypress e2e.js:
 * - Sets cookie consent, Safe Labs terms, Beamer keys in localStorage
 * - Dismisses outreach popup via sessionStorage
 * - Provides `goto()` with Safe auto-trust and 429 retry
 */

export type SafePageFixtures = {
  /** Page with Safe-specific localStorage pre-seeded (cookie consent, terms, etc.) */
  safePage: Page
}

export const test = base.extend<SafePageFixtures>({
  safePage: async ({ page }, use) => {
    // Pre-seed localStorage before any navigation — mirrors Cypress beforeEach() in e2e.js
    await page.addInitScript(() => {
      const getDate = () => new Date().toISOString()

      // Cookie consent
      const cookieState = { necessary: true, updates: true, analytics: true, terms: true }
      window.localStorage.setItem('SAFE_v2__cookies_terms', JSON.stringify(cookieState))

      // Safe Labs terms
      window.localStorage.setItem('SAFE_v2__safe-labs-terms', JSON.stringify({ v1: true }))

      // Beamer notification suppression
      const beamerProductId = 'bAnQuYms57089'
      window.localStorage.setItem(`_BEAMER_FIRST_VISIT_${beamerProductId}`, getDate())
      window.localStorage.setItem(`_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_${beamerProductId}`, getDate())

      // Safe Apps info modal
      window.localStorage.setItem(
        'SAFE_v2__SafeApps__infoModal',
        JSON.stringify({ 'https://safe-apps-test-app.pages.dev': { consentsAccepted: true } }),
      )

      // Suppress outreach popup
      window.sessionStorage.setItem('SAFE_v2__outreachPopup_session_v2', String(Date.now()))
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'

// ── Navigation helpers ─────────────────────────────────────────────────────────

/**
 * Navigate to a Safe URL with auto-trust and 429 retry.
 * Replicates the cy.visit() override from Cypress commands.js.
 *
 * @param page - Playwright Page instance (use safePage from fixture)
 * @param url - Relative URL (e.g., '/home?safe=sep:0x...')
 */
// Map chain prefix to chain ID for addedSafes structure
const chainMap: Record<string, string> = {
  eth: '1',
  gor: '5',
  sep: '11155111',
  gno: '100',
  matic: '137',
  bnb: '56',
  aurora: '1313161554',
  avax: '43114',
  linea: '59144',
  zksync: '324',
  base: '8453',
  oeth: '10',
}

export async function safeGoto(page: Page, url: string) {
  // Extract Safe address from URL and trust it in localStorage.
  // Uses addInitScript() instead of page.evaluate() because the page may still
  // be on about:blank — where localStorage access is blocked by browser security.
  // addInitScript runs in the page context AFTER navigation starts, before app JS loads.
  const safeMatch = url.match(/safe=([\w]+:0x[a-fA-F0-9]{40})/)
  if (safeMatch) {
    const safeAddress = safeMatch[1]
    const chainPrefix = safeAddress.split(':')[0]
    const address = safeAddress.split(':')[1]
    const chainId = chainMap[chainPrefix]

    if (chainId) {
      await page.addInitScript(
        ({ chainId, address }) => {
          const existing = JSON.parse(window.localStorage.getItem('SAFE_v2__addedSafes') || '{}')
          if (!existing[chainId]) existing[chainId] = {}
          existing[chainId][address] = { ethBalance: '0', owners: [], threshold: 1 }
          window.localStorage.setItem('SAFE_v2__addedSafes', JSON.stringify(existing))
        },
        { chainId, address },
      )
    }
  }

  // Navigate with retry on 429 (rate limit) — matches Cypress retry logic.
  // Uses 'domcontentloaded' instead of 'load' because Safe{Wallet} keeps WebSocket/SSE
  // connections open to the gateway — the 'load' event never fires in an SPA with
  // persistent connections. Actual page readiness is handled by readySelector in BasePage.goto().
  const maxRetries = 3
  const retryDelay = 6000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })

    if (response && response.status() === 429 && attempt < maxRetries) {
      await page.waitForTimeout(retryDelay)
      continue
    }

    break
  }
}

// ── localStorage helpers ───────────────────────────────────────────────────────

/**
 * Set a value in the app's localStorage.
 *
 * - Call BEFORE navigation (safeGoto): uses addInitScript so it runs in the page
 *   context after navigation starts, avoiding the about:blank SecurityError.
 * - Call AFTER navigation: uses page.evaluate directly (page has an origin, so
 *   localStorage is accessible). Follow with page.reload() to pick up changes.
 *
 * Replaces Cypress main.addToLocalStorage() and main.addToAppLocalStorage().
 */
export async function setLocalStorage(
  page: Page,
  key: string,
  value: unknown,
  options?: { afterNavigation?: boolean },
) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)

  if (options?.afterNavigation) {
    // Page already has an origin — safe to evaluate directly
    await page.evaluate(
      ({ key, value }) => {
        window.localStorage.setItem(key, value)
      },
      { key, value: serialized },
    )
  } else {
    // Page may be on about:blank — use addInitScript to defer until navigation
    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.setItem(key, value)
      },
      { key, value: serialized },
    )
  }
}
