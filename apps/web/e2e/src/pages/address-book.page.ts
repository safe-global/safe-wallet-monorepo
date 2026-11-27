/**
 * Address Book Page Object — the local (browser-stored) address book of a Safe: the entries table and the
 * create, edit and delete dialogs.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class AddressBookPage {
  readonly newEntryButton: Locator
  readonly nameInput: Locator
  readonly addressInput: Locator
  readonly saveButton: Locator
  readonly confirmDeleteButton: Locator
  /** The placeholder that replaces the table when the Safe's chain has no entries */
  readonly emptyState: Locator

  constructor(private readonly page: Page) {
    const dialog = page.getByRole('dialog')
    this.newEntryButton = page.getByRole('button', { name: 'New entry' })
    this.nameInput = dialog.getByRole('textbox', { name: /^Name/ })
    this.addressInput = dialog.getByRole('textbox', { name: /^Address/ })
    this.saveButton = dialog.getByRole('button', { name: 'Save' })
    this.confirmDeleteButton = dialog.getByRole('button', { name: 'Delete' })
    this.emptyState = page.getByText(/^No entries found/)
  }

  /** Open the address book of the Safe (`sep:0x…`) */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.addressBook}?safe=${safe}`)
  }

  /** The table row whose name is exactly `name` */
  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name, exact: true }) })
  }

  editButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: 'Edit entry' })
  }

  deleteButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: 'Delete entry' })
  }

  /** "New entry": save `address` under `name` */
  async addEntry({ name, address }: { name: string; address: string }): Promise<void> {
    await this.newEntryButton.click()
    await this.nameInput.fill(name)
    await this.addressInput.fill(address)
    await this.saveButton.click()
  }

  /** Edit the entry `oldName` and save it as `newName` */
  async rename(oldName: string, newName: string): Promise<void> {
    await this.editButton(oldName).click()
    await this.nameInput.fill(newName)
    await this.saveButton.click()
  }

  /** Delete the entry `name` and confirm */
  async remove(name: string): Promise<void> {
    await this.deleteButton(name).click()
    await this.confirmDeleteButton.click()
  }
}
