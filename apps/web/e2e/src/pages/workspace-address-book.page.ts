import { type Locator, type Page } from '@playwright/test'

export class WorkspaceAddressBookPage {
  readonly importButton: Locator

  constructor(private readonly page: Page) {
    this.importButton = page.getByRole('button', { name: 'Import', exact: true })
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`/spaces/address-book?spaceId=${workspaceId}`)
  }

  tab(label: string): Locator {
    return this.page.getByRole('tab', { name: new RegExp(`^${label}`) })
  }

  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text })
  }

  rowMenuButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Actions for ${name}` })
  }

  menuItem(name: string): Locator {
    return this.page.getByRole('menuitem', { name })
  }

  async importCsv(csv: string): Promise<void> {
    await this.importButton.click()
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Import address book' })
    await dialog
      .locator('input[type="file"]')
      .setInputFiles({ name: 'contacts.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await dialog.getByRole('button', { name: 'Import', exact: true }).click()
  }

  async addSuggestion(suggestedName: string): Promise<void> {
    await this.row(suggestedName).getByRole('button', { name: 'Add to Workspace' }).click()
    await this.page.getByRole('dialog').getByRole('button', { name: 'Add 1 contact' }).click()
  }

  async requestToAdd(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Request to add' }).click()
    await this.page.getByRole('dialog').getByRole('button', { name: 'Request to add' }).click()
  }

  async addLocalContactToWorkspace(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Add to Workspace' }).click()
  }

  async addTag(contactName: string, tagName: string): Promise<void> {
    await this.rowMenuButton(contactName).click()
    await this.menuItem('Edit tags').click()
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Edit tags' })
    await dialog.getByRole('button', { name: /Tags/ }).click()
    await this.page.getByRole('listbox', { name: 'Tags' }).getByRole('option', { name: tagName }).click()
    await this.page.keyboard.press('Escape')
    await dialog.getByTestId('save-tags-btn').click()
  }
}
