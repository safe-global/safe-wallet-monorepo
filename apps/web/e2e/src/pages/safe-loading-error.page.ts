/**
 * Safe loading-error screen Page Object.
 *
 * Rule: Page Objects hold locators, actions and the copy they select on.
 * Assertions belong in the test file, never here.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

/** Headline shown when CGW blocks the Safe with `451 Unavailable for legal reasons` */
export const LEGAL_BLOCK_MESSAGE = 'Unavailable for legal reasons'

/** Headline shown for every other Safe loading failure — mirrors `GENERIC_LOADING_ERROR` in the app */
export const GENERIC_LOADING_ERROR = "This Safe account couldn't be loaded"

/** CGW safe-info endpoint, without its sub-resources (`/balances`, `/collectibles`, …) */
export const SAFE_INFO_ENDPOINT = /\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]{40}(\?|$)/

export class SafeLoadingErrorPage {
  readonly page: Page

  // Locators
  readonly container: Locator
  readonly mainPageButton: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.getByTestId('safe-loading-error')
    this.mainPageButton = page.getByRole('link', { name: 'Go to the main page' })
  }

  /** Stub the safe-info request with a status the real API cannot be made to return */
  async stubSafeInfo(status: number, body: Record<string, unknown>): Promise<void> {
    await this.page.route(SAFE_INFO_ENDPOINT, (route) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
    )
  }

  /** Open a Safe's dashboard, which renders this screen when safe-info fails */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.home}?safe=${safe}`)
  }
}
