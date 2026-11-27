import { type Page, type Locator } from '@playwright/test'

export class BatchSidebarPage {
  readonly openButton: Locator
  readonly sidebar: Locator
  readonly emptyBatch: Locator
  readonly newTransactionButton: Locator
  readonly addNewTransactionButton: Locator
  readonly confirmBatchButton: Locator
  readonly sendTokensButton: Locator

  constructor(page: Page) {
    this.openButton = page.getByRole('button', { name: 'Batch transactions' })
    this.sidebar = page.getByRole('dialog').filter({ hasText: 'Batched transactions' })
    this.emptyBatch = this.sidebar.getByText('Add an initial transaction to the batch')
    this.newTransactionButton = this.sidebar.getByRole('button', { name: 'New transaction', exact: true })
    this.addNewTransactionButton = this.sidebar.getByRole('button', { name: 'Add new transaction' })
    this.confirmBatchButton = this.sidebar.getByRole('button', { name: 'Confirm batch' })
    this.sendTokensButton = page.getByTestId('send-tokens-btn')
  }

  /** Start a token transfer from the empty batch's "New transaction"; the send-tokens form opens */
  async sendTokensFromEmptyBatch(): Promise<void> {
    await this.sendTokensFrom(this.newTransactionButton)
  }

  /** Start a token transfer from the batch's "Add new transaction"; the send-tokens form opens */
  async sendTokensFromBatch(): Promise<void> {
    await this.sendTokensFrom(this.addNewTransactionButton)
  }

  /** Open the batch and confirm it; the review of the batched transactions opens */
  async confirmBatch(): Promise<void> {
    await this.openButton.click()
    await this.confirmBatchButton.click()
  }

  private async sendTokensFrom(entryPoint: Locator): Promise<void> {
    await this.openButton.click()
    await entryPoint.click()
    await this.sendTokensButton.click()
  }
}
