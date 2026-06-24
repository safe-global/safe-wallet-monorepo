/**
 * Home / Dashboard Page Object.
 *
 * Rule: Page Objects hold locators and actions only.
 * Assertions belong in the test file, never here.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class HomePage {
  readonly page: Page

  // Locators
  readonly sidebar: Locator
  readonly safeHeaderInfo: Locator
  readonly connectWalletBtn: Locator
  readonly pendingTxWidget: Locator
  readonly pendingTxItems: Locator
  readonly viewAllLink: Locator
  readonly swapBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.getByRole('navigation')
    this.safeHeaderInfo = page.getByTestId('safe-header-info')
    this.connectWalletBtn = page.getByTestId('connect-wallet-btn')
    this.pendingTxWidget = page.getByTestId('pending-tx-widget')
    this.pendingTxItems = page.getByTestId('pending-tx-widget').locator('[data-testid]')
    this.viewAllLink = page.getByRole('link', { name: /view all/i })
    this.swapBtn = page.getByRole('button', { name: /swap/i })
  }

  /** Navigate to dashboard for a given Safe address */
  async goto(safeAddress: string): Promise<void> {
    await this.page.goto(`${ROUTES.home}?safe=${safeAddress}`)
  }

  /** Wait for the dashboard to finish loading */
  async waitForDashboardLoaded(): Promise<void> {
    await this.safeHeaderInfo.waitFor({ state: 'visible' })
  }

  /** Click the connect wallet button */
  async clickConnectWallet(): Promise<void> {
    await this.connectWalletBtn.click()
  }

  /** Get the count of pending transactions shown in the widget */
  async getPendingTxCount(): Promise<number> {
    return this.pendingTxItems.count()
  }
}
