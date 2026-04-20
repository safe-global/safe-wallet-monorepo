import { type Page, type Locator, expect } from '@playwright/test'
import { safeGoto, setLocalStorage } from '../fixtures/base.fixture'

export class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(url: string, options?: { readySelector?: Locator; timeout?: number }) {
    await safeGoto(this.page, url)
    if (options?.readySelector) {
      await expect(options.readySelector).toBeVisible({ timeout: options.timeout ?? 120_000 })
    }
  }

  async setLocalStorage(key: string, value: unknown) {
    await setLocalStorage(this.page, key, value)
  }

  async setLocalStorageAndReload(key: string, value: unknown) {
    await setLocalStorage(this.page, key, value)
    await this.page.reload()
  }

  // ── Popup dismissal ──────────────────────────────────────────────────────────

  async closeOutreachPopup() {
    const closeBtn = this.page.locator('button[aria-label="close outreach popup"]')
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
  }

  async closeSecurityNotice() {
    const btn = this.page.getByRole('button', { name: 'I understand' })
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click()
    }
  }

  // ── Common selectors ─────────────────────────────────────────────────────────

  get tableRow(): Locator {
    return this.page.locator('[data-testid="table-row"]')
  }

  get tableContainer(): Locator {
    return this.page.locator('[data-testid="table-container"]')
  }

  get nextPageBtn(): Locator {
    return this.page.locator('button[aria-label="Go to next page"]')
  }

  get previousPageBtn(): Locator {
    return this.page.locator('button[aria-label="Go to previous page"]')
  }

  get modalTitle(): Locator {
    return this.page.locator('[data-testid="modal-title"]')
  }

  get modalCloseBtn(): Locator {
    return this.page.locator('[data-testid="modal-dialog-close-btn"]')
  }

  // ── Verification helpers ────────────────────────────────────────────────────

  async verifyValuesExist(containerSelector: string, values: string[]) {
    const container = this.page.locator(containerSelector)
    for (const value of values) {
      await expect(container).toContainText(value)
    }
  }

  async verifyValuesDoNotExist(containerSelector: string, values: string[]) {
    const container = this.page.locator(containerSelector)
    for (const value of values) {
      await expect(container).not.toContainText(value)
    }
  }

  async verifyElementsIsVisible(selectors: string[]) {
    for (const selector of selectors) {
      await expect(this.page.locator(selector)).toBeVisible()
    }
  }

  async verifyElementsCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count)
  }

  async checkTextsExistWithinElement(containerSelector: string, texts: string[]) {
    const container = this.page.locator(containerSelector)
    await expect(container).toBeVisible()
    for (const text of texts) {
      await expect(container.locator('div').filter({ hasText: text }).first()).toBeVisible()
    }
  }

  // ── iFrame ──────────────────────────────────────────────────────────────────

  iframe(selector: string) {
    return this.page.frameLocator(selector)
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  async awaitVisualStability(ms = 7000) {
    await this.page.waitForTimeout(ms)
  }
}
