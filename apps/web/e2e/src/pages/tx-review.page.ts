import { type Page, type Locator } from '@playwright/test'

// The review loads the transaction, its decoding and the Safe Shield scan before it shows the checkbox
const REVIEW_LOAD_TIMEOUT_MS = 60_000
const EXECUTION_TIMEOUT_MS = 60_000
const EXECUTED_STATUS = /Transaction was (processed|successful)/

export class TxReviewPage {
  /** Safe Shield flags a Safe that is not in the user's accounts, which every seeded Safe is */
  readonly riskConfirmation: Locator
  readonly continueButton: Locator
  readonly signButton: Locator
  readonly connectedWalletMethod: Locator
  readonly executeButton: Locator
  /** The success screen's status: "processed" once mined, "successful" once indexed */
  readonly status: Locator
  readonly submitActions: Locator
  readonly addToBatchChoice: Locator
  readonly addToBatchButton: Locator

  constructor(page: Page) {
    this.riskConfirmation = page.getByTestId('risk-confirmation-checkbox')
    this.continueButton = page.getByTestId('continue-sign-btn')
    this.signButton = page.getByTestId('combo-submit-sign')
    this.connectedWalletMethod = page.getByTestId('connected-wallet-execution-method')
    this.executeButton = page.getByTestId('combo-submit-execute')
    this.status = page.getByTestId('transaction-status')
    this.submitActions = page.getByTestId('combo-submit-dropdown')
    this.addToBatchChoice = page.getByRole('menuitem', { name: 'Add to batch' })
    this.addToBatchButton = page.getByTestId('combo-submit-batching')
  }

  /** Confirm the risk, continue from the review and sign with the connected wallet */
  async sign(): Promise<void> {
    await this.confirmRisk()
    await this.continueButton.click()
    await this.signButton.click()
  }

  /** Execute a fully signed transaction with the connected wallet, not the relay */
  async execute(): Promise<void> {
    await this.connectedWalletMethod.click()
    await this.executeButton.click()
  }

  /** Confirm the risk, continue from the review and add the transaction to the batch instead of signing it */
  async addToBatch(): Promise<void> {
    await this.confirmRisk()
    await this.continueButton.click()
    await this.submitActions.click()
    await this.addToBatchChoice.click()
    await this.addToBatchButton.click()
  }

  /** Wait until the success screen reports the transaction as mined; the indexer may still be behind */
  async waitForExecution(): Promise<void> {
    await this.status.filter({ hasText: EXECUTED_STATUS }).waitFor({ timeout: EXECUTION_TIMEOUT_MS })
  }

  private async confirmRisk(): Promise<void> {
    await this.riskConfirmation.click({ timeout: REVIEW_LOAD_TIMEOUT_MS })
  }
}
