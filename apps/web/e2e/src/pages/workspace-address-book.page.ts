/**
 * Workspace Address Book Page Object — the v2 address book of a Workspace: its tabs, the contact rows and their
 * menu, the CSV import, and the actions of the Suggested and Local contacts tabs.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Locator, type Page } from '@playwright/test'

export class WorkspaceAddressBookPage {
  readonly addContactButton: Locator
  readonly importButton: Locator
  readonly exportButton: Locator

  constructor(private readonly page: Page) {
    this.addContactButton = page.getByRole('button', { name: 'Add contact' })
    this.importButton = page.getByRole('button', { name: 'Import', exact: true })
    this.exportButton = page.getByRole('button', { name: 'Export', exact: true })
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`/spaces/address-book?spaceId=${workspaceId}`)
  }

  /** The tab whose label starts with `label`; the label ends with a count once its data has loaded */
  tab(label: string): Locator {
    return this.page.getByRole('tab', { name: new RegExp(`^${label}`) })
  }

  /** The table row that shows `text`, such as a contact name */
  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text })
  }

  /** The menu of a Workspace contact: Edit contact, Edit tags and Delete contact, as the role allows */
  rowMenuButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Actions for ${name}` })
  }

  menuItem(name: string): Locator {
    return this.page.getByRole('menuitem', { name })
  }

  /** Imports a CSV file (`address,name,chainId,tags`) from the Import button of the Workspace contacts */
  async importCsv(csv: string): Promise<void> {
    await this.importButton.click()
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Import address book' })
    await dialog
      .locator('input[type="file"]')
      .setInputFiles({ name: 'contacts.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await dialog.getByRole('button', { name: 'Import', exact: true }).click()
  }

  /** Suggested tab, admin: adds the suggestion shown as `suggestedName` under that name */
  async addSuggestion(suggestedName: string): Promise<void> {
    await this.row(suggestedName).getByRole('button', { name: 'Add to Workspace' }).click()
    await this.page.getByRole('dialog').getByRole('button', { name: 'Add 1 contact' }).click()
  }

  /** Suggested or Local contacts tab, member: asks an admin to add the contact shown as `name` */
  async requestToAdd(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Request to add' }).click()
    await this.page.getByRole('dialog').getByRole('button', { name: 'Request to add' }).click()
  }

  /** Local contacts tab, admin: adds the local contact `name` to the Workspace address book */
  async addLocalContactToWorkspace(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Add to Workspace' }).click()
  }
}
