/**
 * Nested Safes Page Object — the nested Safes popover of the Safe header and the flow that creates a nested Safe.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'

export class NestedSafesPage {
  readonly openButton: Locator
  readonly addButton: Locator
  readonly nameInput: Locator
  readonly fundAssetButton: Locator
  readonly amountInputs: Locator
  readonly nextButton: Locator
  readonly list: Locator
  readonly reviewButton: Locator
  readonly saveButton: Locator
  readonly rows: Locator
  readonly parentSafeLink: Locator

  constructor(page: Page) {
    this.openButton = page.getByTestId('nested-safes-button')
    this.addButton = page.getByTestId('add-nested-safe-button')
    this.nameInput = page.getByTestId('nested-safe-name-input')
    this.fundAssetButton = page.getByTestId('fund-asset-button')
    this.amountInputs = page.getByTestId('token-amount-field')
    this.nextButton = page.getByTestId('next-button')
    this.list = page.getByTestId('nested-safe-list')
    this.reviewButton = page.getByTestId('review-nested-safes-button')
    this.saveButton = page.getByTestId('save-manage-nested-safes')
    this.rows = page.getByTestId('safe-list-item')
    this.parentSafeLink = page.getByLabel('Parent Safe').getByRole('link')
  }

  /** The list shortens addresses outside manage mode, so a row is found by its Safe name */
  row(name: string): Locator {
    return this.rows.filter({ hasText: name })
  }

  openSafeLink(name: string): Locator {
    return this.row(name).getByRole('link', { name: 'Open Safe' })
  }

  /**
   * Start a nested Safe named `name` from the popover of the open Safe; the review opens.
   * With `fund`, the new Safe also gets that amount of the first asset the form offers.
   */
  async create(name: string, { fund }: { fund?: string } = {}): Promise<void> {
    await this.openButton.click()
    await this.addButton.click()
    await this.nameInput.fill(name)
    if (fund) {
      await this.fundAssetButton.click()
      await this.amountInputs.first().fill(fund)
    }
    await this.nextButton.click()
  }

  /** Review the nested Safes for the first time and keep only the Safe named `name` */
  async curateOnly(name: string): Promise<void> {
    await this.openButton.click()
    await this.reviewButton.click()
    await this.row(name).click()
    await this.saveButton.click()
  }
}
