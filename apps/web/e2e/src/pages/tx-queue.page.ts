import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class TxQueuePage {
  readonly transactions: Locator
  readonly emptyQueue: Locator
  readonly rejectButton: Locator
  readonly replaceChoice: Locator
  readonly rejectChoice: Locator
  readonly deleteChoice: Locator
  readonly confirmDeleteButton: Locator
  /** Opens the review of every fully signed transaction in a row from the next nonce */
  readonly bulkExecuteButton: Locator

  constructor(private readonly page: Page) {
    this.transactions = page.getByTestId('transaction-item')
    this.emptyQueue = page.getByText('Queued transactions will appear here')
    this.rejectButton = page.getByTestId('reject-btn')
    this.replaceChoice = page.getByRole('button', { name: /Replace with another transaction/ })
    this.rejectChoice = page.getByRole('button', { name: /Reject transaction/ })
    this.deleteChoice = page.getByRole('button', { name: /Delete from the queue/ })
    this.confirmDeleteButton = page.getByTestId('delete-tx-btn')
    this.bulkExecuteButton = page.getByRole('button', { name: /^Bulk execute/ })
  }

  /** Open the queue of the Safe (`sep:0x…`) */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.transactionsQueue}?safe=${safe}`)
  }

  /** Open the page of one transaction by its CGW ID */
  async openTransaction(safe: string, txId: string): Promise<void> {
    await this.page.goto(`${ROUTES.transactions}/tx?safe=${safe}&id=${txId}`)
  }

  /** The queue row that shows `nonce` */
  transactionWithNonce(nonce: number): Locator {
    return this.transactions.filter({ has: this.page.getByTestId('nonce').getByText(String(nonce), { exact: true }) })
  }

  /** Start a replacement with the same nonce; the send-tokens form opens */
  async replace(): Promise<void> {
    await this.rejectButton.click()
    await this.replaceChoice.click()
  }

  /** Start an on-chain rejection; its review opens */
  async reject(): Promise<void> {
    await this.rejectButton.click()
    await this.rejectChoice.click()
  }

  /** Delete the transaction from the queue with the proposer's signature */
  async deleteFromQueue(): Promise<void> {
    await this.rejectButton.click()
    await this.deleteChoice.click()
    await this.confirmDeleteButton.click()
  }

  /** Confirm the queued transaction at `nonce` from its queue row; its review opens */
  async confirm(nonce: number): Promise<void> {
    await this.transactionWithNonce(nonce).getByRole('button', { name: 'Confirm' }).click()
  }
}
