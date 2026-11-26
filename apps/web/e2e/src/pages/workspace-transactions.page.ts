/**
 * Workspace Transactions Page Object — the Pending tab of a Workspace: its New transaction button and Safe picker,
 * and the queue rows with their Sign and Execute buttons and their actions menu.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'

export class WorkspaceTransactionsPage {
  readonly newTransactionButton: Locator
  readonly safePicker: Locator
  readonly sendTokensButton: Locator
  readonly rows: Locator
  readonly emptyQueue: Locator
  readonly confirmDeleteButton: Locator

  constructor(private readonly page: Page) {
    this.newTransactionButton = page.getByRole('button', { name: 'New transaction' })
    this.safePicker = page.getByRole('dialog', { name: 'New transaction from' })
    this.sendTokensButton = page.getByTestId('send-tokens-btn')
    this.rows = page.getByTestId('space-queue-row')
    this.emptyQueue = page.getByText('Pending transactions of your Safe accounts will appear here')
    this.confirmDeleteButton = page.getByTestId('delete-tx-btn')
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`/spaces/transactions?spaceId=${workspaceId}`)
  }

  /** From New transaction, pick the Safe named `safeName` in the Workspace and open its send-tokens form */
  async startTransfer(safeName: string): Promise<void> {
    await this.newTransactionButton.click()
    await this.safePicker.getByTestId('safe-list-item').filter({ hasText: safeName }).click()
    await this.sendTokensButton.click()
  }

  /** The queue row of the transaction with `nonce` */
  row(nonce: number): Locator {
    return this.rows.filter({ has: this.actionsMenuButton(nonce) })
  }

  /** Sign the transaction with `nonce` from its row; its review opens */
  async sign(nonce: number): Promise<void> {
    await this.row(nonce).getByRole('button', { name: 'Sign', exact: true }).click()
  }

  /** Execute the fully signed transaction with `nonce` from its row; its review opens */
  async execute(nonce: number): Promise<void> {
    await this.row(nonce).getByTestId('execute-tx-btn').click()
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
