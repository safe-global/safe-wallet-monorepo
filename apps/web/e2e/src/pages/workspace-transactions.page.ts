/**
 * Workspace Transactions Page Object — the Pending tab, which lists the queue of every Safe in a Workspace.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class WorkspaceTransactionsPage {
  readonly queueTable: Locator
  readonly rows: Locator
  readonly newTransactionButton: Locator

  constructor(private readonly page: Page) {
    this.queueTable = page.getByRole('table', { name: 'Pending transactions' })
    this.rows = this.queueTable.getByTestId('space-queue-row')
    this.newTransactionButton = page.getByRole('button', { name: 'New transaction' })
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.spacesTransactions}?spaceId=${workspaceId}`)
  }

  /** Start a new transaction from the Workspace for the Safe named `safeName`; the new-transaction flow opens */
  async newTransaction(safeName: string): Promise<void> {
    await this.newTransactionButton.click()
    await this.page.getByRole('dialog').getByTestId('safe-list-item').filter({ hasText: safeName }).click()
  }

  /** Sign the transaction in `row` from the Workspace; its review opens for the row's Safe */
  async sign(row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'Sign' }).click()
  }

  /** Execute the fully signed transaction in `row` from the Workspace; its review opens for the row's Safe */
  async execute(row: Locator): Promise<void> {
    await row.getByTestId('execute-tx-btn').click()
  }
}
