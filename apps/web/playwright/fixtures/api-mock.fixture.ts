import { type Page, type Route } from '@playwright/test'

/**
 * API mock helpers for smoke and visual tests.
 *
 * Ported from cypress/support/visual-mocks.js.
 * Uses Playwright's page.route() instead of Cypress cy.intercept().
 */

/** Route a URL pattern to return a JSON fixture */
export async function mockRoute(page: Page, urlPattern: string, json: unknown) {
  await page.route(urlPattern, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(json),
    }),
  )
}

/** Route a URL pattern to return an empty page (common for queued/history) */
export async function mockEmptyPage(page: Page, urlPattern: string) {
  await mockRoute(page, urlPattern, { count: 0, next: null, previous: null, results: [] })
}

/**
 * Mock all volatile CGW endpoints for deterministic screenshots.
 *
 * This is the Playwright equivalent of mockVisualTestApis() in visual-mocks.js.
 * Call in beforeEach for visual tests.
 *
 * Note: The actual fixture data files are shared with Storybook MSW fixtures
 * via symlink at cypress/fixtures/msw → config/test/msw/fixtures.
 * You'll need to load the JSON fixtures and pass them here.
 */
export async function mockVisualTestApis(
  page: Page,
  fixtures: {
    chains?: unknown
    safeInfo?: unknown
    balances?: unknown
    portfolio?: unknown
    positions?: unknown
    apps?: unknown
  },
) {
  if (fixtures.chains) {
    await mockRoute(page, '**/v2/chains', fixtures.chains)
    await page.route('**/v2/chains/*', (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.chains),
      })
    })
  }

  if (fixtures.balances) await mockRoute(page, '**/balances/**', fixtures.balances)
  if (fixtures.portfolio) await mockRoute(page, '**/portfolio/**', fixtures.portfolio)
  if (fixtures.positions) await mockRoute(page, '**/positions/**', fixtures.positions)
  if (fixtures.apps) await mockRoute(page, '**/safe-apps*', fixtures.apps)

  // Always mock these as empty for visual tests
  await mockEmptyPage(page, '**/queued*')
  await mockEmptyPage(page, '**/transactions/history**')
  await mockEmptyPage(page, '**/targeted-messaging/**')
}
