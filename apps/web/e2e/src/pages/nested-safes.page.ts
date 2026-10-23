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
  readonly nextButton: Locator
  readonly list: Locator

  constructor(page: Page) {
    this.openButton = page.getByTestId('nested-safes-button')
    this.addButton = page.getByTestId('add-nested-safe-button')
    this.nameInput = page.getByTestId('nested-safe-name-input')
    this.nextButton = page.getByTestId('next-button')
    this.list = page.getByTestId('nested-safe-list')
  }

  /** Start a nested Safe named `name` from the popover of the open Safe; the review opens */
  async create(name: string): Promise<void> {
    await this.openButton.click()
    await this.addButton.click()
    await this.nameInput.fill(name)
    await this.nextButton.click()
  }
}
