/**
 * Transaction history Page Object.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the
 * test file, never here. Waiting (waitFor / waitForResponse) is allowed.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class TxHistoryPage {
  readonly transactions: Locator

  constructor(private readonly page: Page) {
    this.transactions = page.getByTestId('transaction-item')
  }

  /** Open the history of the Safe (`sep:0x…`) and wait until CGW answers the history request */
  async goto(safe: string): Promise<void> {
    const history = this.page.waitForResponse(
      (response) => response.url().includes('/transactions/history') && response.request().method() === 'GET',
    )
    await this.page.goto(`${ROUTES.transactionsHistory}?safe=${safe}`)
    const response = await history
    if (!response.ok()) throw new Error(`The history request answered ${response.status()}: ${response.url()}`)
  }

  /** The rows that show `status`, e.g. "Success" */
  transactionsWithStatus(status: string): Locator {
    return this.transactions.filter({ has: this.page.getByTestId('tx-status-label').getByText(status) })
  }
}
