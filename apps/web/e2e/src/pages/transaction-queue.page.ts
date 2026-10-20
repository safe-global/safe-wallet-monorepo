/**
 * Transaction queue Page Object — signing and executing a queued transaction with the connected wallet.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the
 * test file, never here. Waiting (waitFor / waitForResponse) is allowed.
 */
import { type Page, type Locator } from '@playwright/test'

export class TransactionQueuePage {
  /** The only queued transaction of the Safe */
  readonly queuedTransaction: Locator
  readonly confirmBtn: Locator
  readonly executeBtn: Locator
  readonly continueBtn: Locator
  /**
   * Asked once the threat analysis fails, as it always does on the isolated stack, which has no analysis service.
   * The label: the checkbox itself has no accessible name.
   */
  readonly riskConfirmation: Locator
  readonly signBtn: Locator
  readonly submitExecutionBtn: Locator
  readonly connectedWalletExecution: Locator
  /** The app's Ledger dialog, open while the device reviews a transaction */
  readonly hashComparisonDialog: Locator
  readonly transactionStatus: Locator

  constructor(private readonly page: Page) {
    this.queuedTransaction = page.getByTestId('transaction-item')
    this.confirmBtn = this.queuedTransaction.getByRole('button', { name: 'Confirm' })
    this.executeBtn = this.queuedTransaction.getByTestId('execute-tx-btn')
    this.continueBtn = page.getByTestId('continue-sign-btn')
    this.riskConfirmation = page.getByTestId('risk-confirmation-checkbox')
    this.signBtn = page.getByRole('button', { name: 'Sign', exact: true })
    this.submitExecutionBtn = page.getByTestId('combo-submit-execute')
    this.connectedWalletExecution = page.getByTestId('connected-wallet-execution-method')
    this.hashComparisonDialog = page.getByRole('dialog', { name: 'Compare transaction hash' })
    this.transactionStatus = page.getByTestId('transaction-status')
  }

  async goto(safe: string): Promise<void> {
    await this.page.goto(`/transactions/queue?safe=${safe}`)
    await this.queuedTransaction.waitFor({ state: 'visible' })
  }

  /** Opens the queued transaction for a signature and submits it; the wallet then asks for the signature. */
  async startSigning(): Promise<void> {
    await this.confirmBtn.click()
    await this.continueAfterRiskCheck()
    await this.signBtn.click()
  }

  /** Opens the queued transaction for execution with the connected wallet and submits it. */
  async startExecution(): Promise<void> {
    await this.executeBtn.click()
    await this.continueAfterRiskCheck()
    // The isolated chain sponsors execution and selects the relay by default, which needs no wallet signature.
    await this.connectedWalletExecution.click()
    await this.submitExecutionBtn.click()
  }

  /**
   * Accepts the risk of the failed threat analysis, then continues. Continue is enabled while the analysis still
   * runs, but the later Sign and Execute buttons stay disabled until the risk is accepted.
   */
  private async continueAfterRiskCheck(): Promise<void> {
    await this.riskConfirmation.click()
    await this.continueBtn.click()
  }
}
