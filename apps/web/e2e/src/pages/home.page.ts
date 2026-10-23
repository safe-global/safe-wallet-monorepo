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
  /** One row per nonce, each a link to the transaction */
  readonly pendingTxRows: Locator
  readonly viewAllLink: Locator
  readonly swapBtn: Locator
  /** "Top positions"; hidden while the Safe has no positions */
  readonly positionsWidget: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.getByRole('navigation')
    this.safeHeaderInfo = page.getByTestId('safe-header-info')
    this.connectWalletBtn = page.getByTestId('connect-wallet-btn')
    this.pendingTxWidget = page.getByTestId('pending-tx-widget')
    this.pendingTxRows = this.pendingTxWidget.getByTestId('tx-pending-item')
    this.viewAllLink = page.getByRole('link', { name: /view all/i })
    this.swapBtn = page.getByRole('button', { name: /swap/i })
    this.positionsWidget = page.getByTestId('positions-widget')
  }

  /** Navigate to dashboard for a given Safe address */
  /** Open the Safe dashboard, in a Workspace when `spaceId` is given */
  async goto(safeAddress: string, spaceId?: string): Promise<void> {
    await this.page.goto(`${ROUTES.home}?safe=${safeAddress}${spaceId ? `&spaceId=${spaceId}` : ''}`)
  }

  /** Wait for the dashboard to finish loading */
  async waitForDashboardLoaded(): Promise<void> {
    await this.safeHeaderInfo.waitFor({ state: 'visible' })
  }

  /** Click the connect wallet button */
  async clickConnectWallet(): Promise<void> {
    await this.connectWalletBtn.click()
  }
}
