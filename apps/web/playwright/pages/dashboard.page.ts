import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'
import staticSafes from '../data/safes/static'
import * as constants from '../data/constants'

export class DashboardPage extends BasePage {
  // ── Selectors ────────────────────────────────────────────────────────────────

  readonly pendingTxWidget: Locator
  readonly pendingTxItem: Locator
  readonly assetsWidget: Locator
  readonly noTxText: Locator
  readonly viewAllLink: Locator
  readonly exploreAppsBtn: Locator
  readonly actionRequiredPanel: Locator
  readonly actionRequiredPanelToggle: Locator
  readonly actionRequiredPanelContent: Locator

  constructor(page: Page) {
    super(page)
    this.pendingTxWidget = page.locator('[data-testid="pending-tx-widget"]')
    this.pendingTxItem = page.locator('[data-testid="tx-pending-item"]')
    this.assetsWidget = page.locator('[data-testid="assets-widget"]')
    this.noTxText = page.locator('[data-testid="no-tx-text"]')
    this.viewAllLink = page.locator('[data-testid="view-all-link"][href^="/transactions/queue"]')
    this.exploreAppsBtn = page.locator('[data-testid="explore-apps-btn"]')
    this.actionRequiredPanel = page.locator('[data-testid="action-required-panel"]')
    this.actionRequiredPanelToggle = page.locator('[data-testid="action-required-panel-toggle"]')
    this.actionRequiredPanelContent = page.locator('[data-testid="action-required-panel-content"]')
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  async clickOnTxByIndex(index: number) {
    const item = this.pendingTxItem.nth(index)
    await expect(item).toHaveAttribute('href', /safe=.{3,}/)
    await item.click()
    await expect(this.page.locator('[data-testid="tx-details"]')).toBeVisible()
  }

  async clickOnViewAllBtn() {
    await this.viewAllLink.click()
  }

  async expandActionRequiredPanel() {
    await expect(this.actionRequiredPanel).toBeVisible({ timeout: 30_000 })
    await this.actionRequiredPanelToggle.click()
    await expect(this.actionRequiredPanelContent).toBeVisible({ timeout: 10_000 })
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  async verifyOverviewWidgetData() {
    const overviewSection = this.page.locator('section').filter({ has: this.page.locator('div:has-text("Total")') })
    await expect(overviewSection.getByRole('button', { name: 'Send' })).toBeVisible()
    await expect(overviewSection.getByRole('button', { name: 'Receive' })).toBeVisible()
  }

  async verifyTxQueueWidget() {
    const txQueueSection = this.page
      .locator('section')
      .filter({ has: this.page.locator('p:has-text("Pending transactions")') })

    await expect(txQueueSection).toBeVisible()
    await expect(txQueueSection.locator(':text("This Safe has no queued transactions")')).not.toBeVisible()

    await expect(
      txQueueSection.locator(`a[href^="/transactions/tx?id=multisig_0x"]`).filter({
        hasText: `Send-0.00002 ${constants.tokenAbbreviation.sep}`,
      }),
    ).toBeVisible()

    await expect(
      txQueueSection.locator(
        `a[href="${constants.transactionQueueUrl}${encodeURIComponent(staticSafes.SEP_STATIC_SAFE_2)}"]`,
      ),
    ).toContainText('View all')
  }

  async verifyExplorePossibleSection() {
    const section = this.page
      .locator('section')
      .filter({ has: this.page.locator('h2:has-text("Explore what\'s possible")') })
    await expect(section).toContainText('Swap tokens instantly')
  }

  async verifyDataInPendingTx(data: string[]) {
    await this.checkTextsExistWithinElement('[data-testid="pending-tx-widget"]', data)
  }

  async verifyTxItemInPendingTx(data: string[]) {
    const items = this.pendingTxItem
    const count = await items.count()
    let matchFound = false

    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent()
      if (text && data.every((d) => text.includes(d))) {
        matchFound = true
        break
      }
    }

    expect(matchFound).toBe(true)
  }

  async verifyEmptyTxSection() {
    await expect(this.noTxText).toBeVisible()
  }
}
