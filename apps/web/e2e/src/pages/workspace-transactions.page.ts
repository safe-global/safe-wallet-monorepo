/**
 * Workspace Transactions Page Object — the Pending tab, which lists the queue of every Safe in a Workspace: its New
 * transaction button and Safe picker, and the queue rows with their signature gauge, Sign and Execute buttons and
 * actions menu.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class WorkspaceTransactionsPage {
  readonly queueTable: Locator
  readonly rows: Locator
  readonly emptyQueue: Locator
  readonly newTransactionButton: Locator
  readonly safePicker: Locator
  readonly sendTokensButton: Locator
  readonly confirmDeleteButton: Locator

  constructor(private readonly page: Page) {
    this.queueTable = page.getByRole('table', { name: 'Pending transactions' })
    this.rows = this.queueTable.getByTestId('space-queue-row')
    this.emptyQueue = page.getByText('Pending transactions of your Safe accounts will appear here')
    this.newTransactionButton = page.getByRole('button', { name: 'New transaction' })
    this.safePicker = page.getByRole('dialog', { name: 'New transaction from' })
    this.sendTokensButton = page.getByTestId('send-tokens-btn')
    this.confirmDeleteButton = page.getByTestId('delete-tx-btn')
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.spacesTransactions}?spaceId=${workspaceId}`)
  }

  /** From New transaction, pick the Safe named `safeName` in the Workspace; the new-transaction flow opens */
  async newTransaction(safeName: string): Promise<void> {
    await this.newTransactionButton.click()
    await this.safePicker.getByTestId('safe-list-item').filter({ hasText: safeName }).click()
  }

  /** From New transaction, pick the Safe named `safeName` and open its send-tokens form */
  async startTransfer(safeName: string): Promise<void> {
    await this.newTransaction(safeName)
    await this.sendTokensButton.click()
  }

  /** The row of the transaction with `nonce`, for a Workspace whose only queued Safe is the one under test */
  row(nonce: number): Locator {
    return this.rows.filter({ has: this.actionsMenuButton(nonce) })
  }

  /** The signature gauge of `row`, named by the row's status and count, e.g. "Ready to sign. 1 of 3 signatures" */
  signatures(row: Locator): Locator {
    return row.getByRole('button', { name: / of \d+ signatures?$/ })
  }

  /** Each row's nonce, Safe and summary, signatures and status, without the relative time, which changes on its own */
  rowStates(): Promise<string[]> {
    return this.rows.evaluateAll((rows) =>
      rows.map((row) => {
        const cells = row.querySelectorAll('td')
        return [0, 1, 4, 5].map((cell) => cells[cell]?.innerText.trim() ?? '').join(' | ')
      }),
    )
  }

  /** Sign the transaction in `row`; its review opens for the row's Safe */
  async sign(row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'Sign', exact: true }).click()
  }

  /** Execute the fully signed transaction in `row`; its review opens for the row's Safe */
  async execute(row: Locator): Promise<void> {
    await row.getByTestId('execute-tx-btn').click()
  }

  /** Start a transfer that replaces the transaction with `nonce`; the send-tokens form opens */
  async replace(nonce: number): Promise<void> {
    await this.chooseAction(nonce, 'Replace with a transfer')
  }

  /** Start an on-chain rejection of the transaction with `nonce`; its review opens */
  async reject(nonce: number): Promise<void> {
    await this.chooseAction(nonce, 'Reject')
  }

  /** Delete the transaction with `nonce` from the queue with the proposer's signature */
  async deleteFromQueue(nonce: number): Promise<void> {
    await this.chooseAction(nonce, 'Delete from queue')
    await this.confirmDeleteButton.click()
  }

  private actionsMenuButton(nonce: number): Locator {
    return this.page.getByRole('button', { name: `More actions for #${nonce}`, exact: true })
  }

  private async chooseAction(nonce: number, action: string): Promise<void> {
    await this.actionsMenuButton(nonce).click()
    await this.page.getByRole('menuitem', { name: action, exact: true }).click()
  }
}
