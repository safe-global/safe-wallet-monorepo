/**
 * Assets (balances) Page Object — the manage-tokens menu and the token table's row actions.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class AssetsPage {
  readonly manageTokensButton: Locator
  readonly manageTokensMenu: Locator
  readonly showAllTokensSwitch: Locator
  readonly hideSmallBalancesSwitch: Locator
  readonly hideTokensMenuItem: Locator
  /** Token rows only — the loading skeleton rows carry no symbol. */
  readonly tokenRows: Locator
  /** "N tokens selected" counter in the hide-tokens bar. */
  readonly selectedTokensCount: Locator
  readonly saveHiddenTokensButton: Locator
  readonly cancelHiddenTokensButton: Locator
  readonly deselectAllButton: Locator

  constructor(readonly page: Page) {
    this.manageTokensButton = page.getByTestId('manage-tokens-button')
    this.manageTokensMenu = page.getByTestId('manage-tokens-menu')
    // The switches have no label of their own; the surrounding menuitem row is named by its label text.
    this.showAllTokensSwitch = this.manageTokensMenu
      .getByRole('menuitem', { name: 'Show all tokens' })
      .getByRole('switch')
    this.hideSmallBalancesSwitch = this.manageTokensMenu
      .getByRole('menuitem', { name: 'Hide small balances' })
      .getByRole('switch')
    this.hideTokensMenuItem = this.manageTokensMenu.getByRole('menuitem', { name: /^Hide tokens/ })
    this.tokenRows = page
      .getByRole('table')
      .getByRole('row')
      .filter({ has: page.getByTestId('token-symbol') })
    this.selectedTokensCount = page.getByTestId('hidden-token-count')
    this.saveHiddenTokensButton = page.getByRole('button', { name: 'Save', exact: true })
    this.cancelHiddenTokensButton = page.getByRole('button', { name: 'Cancel', exact: true })
    this.deselectAllButton = page.getByRole('button', { name: 'Deselect all' })
  }

  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.balances}?safe=${safe}`)
  }

  async openManageTokensMenu(): Promise<void> {
    await this.manageTokensButton.click()
    await this.manageTokensMenu.waitFor({ state: 'visible' })
  }

  /** The trigger toggles the menu, and unlike Escape it still dismisses it after a switch was flipped. */
  async closeManageTokensMenu(): Promise<void> {
    await this.manageTokensButton.click()
    await this.manageTokensMenu.waitFor({ state: 'hidden' })
  }

  /** Opens the menu, flips "Show all tokens" only if it differs from `on`, closes the menu. */
  async setShowAllTokens(on: boolean): Promise<void> {
    await this.setMenuSwitch(this.showAllTokensSwitch, on)
  }

  /** Opens the menu, flips "Hide small balances" only if it differs from `on`, closes the menu. */
  async setHideSmallBalances(on: boolean): Promise<void> {
    await this.setMenuSwitch(this.hideSmallBalancesSwitch, on)
  }

  /** Picks "Hide tokens" from the manage-tokens menu; the menu closes itself. */
  async enterHideTokensMode(): Promise<void> {
    await this.openManageTokensMenu()
    await this.hideTokensMenuItem.click()
  }

  hideCheckbox(row: Locator): Locator {
    return row.getByTestId('table-cell-actions').getByRole('checkbox')
  }

  /** The icon Send button in the actions cell (the asset cell holds a mobile-only duplicate). */
  sendButton(row: Locator): Locator {
    return row.getByTestId('table-cell-actions').getByRole('button', { name: 'Send' })
  }

  swapButton(row: Locator): Locator {
    return row.getByTestId('table-cell-actions').getByRole('button', { name: 'Swap' })
  }

  tokenSymbol(row: Locator): Locator {
    return row.getByTestId('token-symbol')
  }

  rowForSymbol(symbol: string): Locator {
    return this.tokenRows.filter({ has: this.page.getByTestId('token-symbol').getByText(symbol, { exact: true }) })
  }

  private async setMenuSwitch(switchControl: Locator, on: boolean): Promise<void> {
    await this.openManageTokensMenu()
    if ((await switchControl.getAttribute('aria-checked')) !== String(on)) {
      await switchControl.click()
    }
    await this.closeManageTokensMenu()
  }
}
