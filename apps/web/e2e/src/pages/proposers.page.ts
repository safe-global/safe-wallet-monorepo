/**
 * Proposers section of Settings → Setup: add, list and delete proposers.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class ProposersPage {
  readonly section: Locator
  readonly addButton: Locator
  readonly addressInput: Locator
  readonly nameInput: Locator
  readonly submitButton: Locator
  readonly confirmDeleteButton: Locator

  constructor(private readonly page: Page) {
    this.section = page.getByTestId('proposer-section')
    this.addButton = page.getByTestId('add-proposer-btn')
    const dialog = page.getByRole('dialog')
    this.addressInput = dialog.getByTestId('address-book-input').getByRole('combobox')
    this.nameInput = dialog.getByLabel('Name')
    this.submitButton = page.getByTestId('submit-proposer-btn')
    this.confirmDeleteButton = page.getByTestId('confirm-delete-proposer-btn')
  }

  /** Opens the settings inside the Workspace, whose plan decides whether proposers can be added */
  async goto(safe: string, workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.settingsSetup}?safe=${safe}&spaceId=${workspaceId}`)
    await this.section.waitFor()
  }

  /** The table row of a proposer, found by the explorer link of its address */
  row(address: string): Locator {
    return this.section.getByRole('row').filter({ has: this.page.locator(`a[href*="${address}"]`) })
  }

  /** Opens the dialog, fills it and submits; the connected wallet signs the delegation */
  async add(address: string, name: string): Promise<void> {
    await this.addButton.click()
    await this.addressInput.fill(address)
    await this.nameInput.fill(name)
    await this.submitButton.click()
  }

  /** Deletes a proposer from its row; the connected wallet signs the deletion */
  async delete(address: string): Promise<void> {
    await this.row(address).getByTestId('delete-proposer-btn').click()
    await this.confirmDeleteButton.click()
  }
}
