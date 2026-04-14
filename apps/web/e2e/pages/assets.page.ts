import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * AssetsPage — page object for the balances/assets view.
 *
 * Ported from cypress/e2e/pages/assets.pages.js
 */
export class AssetsPage extends BasePage {
  // ── Selectors ────────────────────────────────────────────────────────────────

  readonly tokenListTable: Locator
  readonly manageTokensButton: Locator
  readonly manageTokensMenu: Locator
  readonly showAllTokensSwitch: Locator
  readonly hideSmallBalancesSwitch: Locator
  readonly sendBtn: Locator
  readonly tablePagination: Locator

  // Token name constants
  static readonly currencyAave = 'AAVE'
  static readonly currencyTestTokenA = 'TestTokenA'
  static readonly currencyTestTokenB = 'TestTokenB'
  static readonly currencyUSDC = 'USDC'
  static readonly currencyLink = 'LINK'
  static readonly currencyDaiCap = 'DAI'

  static readonly fiatRegex = /\$?(([0-9]{1,3},)*[0-9]{1,3}(\.[0-9]{2})?|0)/

  constructor(page: Page) {
    super(page)
    this.tokenListTable = page.locator('table[aria-labelledby="tableTitle"]')
    this.manageTokensButton = page.locator('[data-testid="manage-tokens-button"]')
    this.manageTokensMenu = page.locator('[data-testid="manage-tokens-menu"]')
    this.showAllTokensSwitch = page.locator('[data-testid="show-all-tokens-switch"]')
    this.hideSmallBalancesSwitch = page.locator('[data-testid="hide-small-balances-switch"]')
    this.sendBtn = page.locator('[data-testid="send-button"]')
    this.tablePagination = page.locator('[data-testid="table-pagination"]')
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Toggle the "Show all tokens" switch in the manage tokens menu */
  async toggleShowAllTokens(shouldShow: boolean) {
    await this.manageTokensButton.click()
    await expect(this.manageTokensMenu).toBeVisible()

    const checkbox = this.showAllTokensSwitch.locator('input[type="checkbox"]')
    const isChecked = await checkbox.isChecked()

    if ((shouldShow && !isChecked) || (!shouldShow && isChecked)) {
      await checkbox.click({ force: true })
    }

    // Close menu by clicking outside
    await this.page.mouse.click(0, 0)
    await expect(this.manageTokensMenu).not.toBeVisible()
  }

  /** Toggle the "Hide small balances" (dust filter) switch */
  async toggleHideDust(shouldHide: boolean) {
    await this.manageTokensButton.click()
    await expect(this.manageTokensMenu).toBeVisible()

    const checkbox = this.hideSmallBalancesSwitch.locator('input[type="checkbox"]')
    const isChecked = await checkbox.isChecked()

    if ((shouldHide && !isChecked) || (!shouldHide && isChecked)) {
      await checkbox.click({ force: true })
    }

    // Close menu by clicking outside
    await this.page.mouse.click(0, 0)
    await expect(this.manageTokensMenu).not.toBeVisible()
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  /** Verify that a token name is present in the asset list */
  async verifyTokenIsPresent(tokenName: string) {
    await expect(this.tokenListTable).toContainText(tokenName)
  }

  /** Verify the tokens tab is selected */
  async verifyTokensTabIsSelected(expected: string) {
    const tokensTab = this.page.locator('[role="tab"]').filter({ hasText: 'Tokens' })
    await expect(tokensTab).toHaveAttribute('aria-selected', expected)
  }
}
