import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './main.page'

export class OwnersPage extends BasePage {
  readonly replaceOwnerBtn: Locator
  readonly newOwnerName: Locator
  readonly newOwnerAddress: Locator
  readonly accountCenter: Locator
  readonly safeAccountNonce: Locator

  static readonly safeAccountNonceStr = 'Safe Account nonce'

  constructor(page: Page) {
    super(page)
    this.replaceOwnerBtn = page.locator('span[data-track="settings: Replace owner"] > span > button')
    this.newOwnerName = page.locator('input[name="newOwner.name"]')
    this.newOwnerAddress = page.locator('input[name="newOwner.address"]')
    this.accountCenter = page.locator('[data-testid="open-account-center"]')
    this.safeAccountNonce = page.locator(`text=${OwnersPage.safeAccountNonceStr}`)
  }

  // ── Getters ───────────────────────────────────────────────────────────────────

  get replaceOwnerBtnFirst(): Locator {
    return this.replaceOwnerBtn.first()
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async openReplaceOwnerWindow(index: number) {
    const btn = this.replaceOwnerBtn.nth(index)
    // Wait for the button to become interactive — right after wallet connection,
    // the UI may re-render and briefly leave the button disabled until the signer
    // is recognized as an owner.
    await expect(btn).toBeEnabled({ timeout: 30_000 })
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
  }
}
