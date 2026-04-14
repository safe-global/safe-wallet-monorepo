import { type Page, type Locator, expect } from '@playwright/test'
import { safeGoto, setLocalStorage } from '../fixtures/base.fixture'

/**
 * BasePage — common operations shared across all page objects.
 *
 * Ports the generic helpers from Cypress main.page.js into a typed class.
 * All page objects should extend this class.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Navigation ───────────────────────────────────────────────────────────────

  /** Navigate to a URL with Safe auto-trust and 429 retry */
  async goto(url: string) {
    await safeGoto(this.page, url)
  }

  /** Set a value in localStorage */
  async setLocalStorage(key: string, value: unknown) {
    await setLocalStorage(this.page, key, value)
  }

  /** Set localStorage then reload so the app picks it up */
  async setLocalStorageAndReload(key: string, value: unknown) {
    await setLocalStorage(this.page, key, value)
    await this.page.reload()
  }

  // ── Popup dismissal ──────────────────────────────────────────────────────────

  /** Close the outreach popup if visible */
  async closeOutreachPopup() {
    const closeBtn = this.page.locator('button[aria-label="close outreach popup"]')
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
  }

  /** Close the security notice if visible */
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

  // ── Generic verification helpers ─────────────────────────────────────────────

  /** Verify that a container element contains all the given text values */
  async verifyValuesExist(containerSelector: string, values: string[]) {
    const container = this.page.locator(containerSelector)
    for (const value of values) {
      await expect(container).toContainText(value)
    }
  }

  /** Verify that a container element does NOT contain any of the given text values */
  async verifyValuesDoNotExist(containerSelector: string, values: string[]) {
    const container = this.page.locator(containerSelector)
    for (const value of values) {
      await expect(container).not.toContainText(value)
    }
  }

  /** Verify that all given selectors are visible */
  async verifyElementsIsVisible(selectors: string[]) {
    for (const selector of selectors) {
      await expect(this.page.locator(selector)).toBeVisible()
    }
  }

  /** Verify the count of elements matching a selector */
  async verifyElementsCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count)
  }

  /** Check that specific texts exist within an element */
  async checkTextsExistWithinElement(containerSelector: string, texts: string[]) {
    const container = this.page.locator(containerSelector)
    await expect(container).toBeVisible()
    for (const text of texts) {
      await expect(container.locator('div').filter({ hasText: text }).first()).toBeVisible()
    }
  }

  // ── iFrame helpers ───────────────────────────────────────────────────────────

  /** Get the iframe body as a FrameLocator */
  iframe(selector: string) {
    return this.page.frameLocator(selector)
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  /** Wait for visual stability (for Argos screenshots) */
  async awaitVisualStability(ms = 7000) {
    await this.page.waitForTimeout(ms)
  }
}
