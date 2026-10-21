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
  /** The spending-limit review has no signing step, only this button */
  readonly spendingLimitExecuteButton: Locator
  /** The success screen's status: "processed" once mined, "successful" once indexed */
  readonly status: Locator
  readonly submitActions: Locator
  readonly addToBatchChoice: Locator
  readonly addToBatchButton: Locator
  /** Submits a bulk execution, which has no sign step */
  readonly submitButton: Locator
  readonly closeButton: Locator
  readonly discardButton: Locator
  readonly signMessageButton: Locator
  /** Shown once a message has all its signatures; it hands the signature to the app that asked for it */
  readonly signedMessageContinueButton: Locator

  constructor(page: Page) {
    this.riskConfirmation = page.getByTestId('risk-confirmation-checkbox')
    this.continueButton = page.getByTestId('continue-sign-btn')
    this.signButton = page.getByTestId('combo-submit-sign')
    this.connectedWalletMethod = page.getByTestId('connected-wallet-execution-method')
    this.executeButton = page.getByTestId('combo-submit-execute')
    this.spendingLimitExecuteButton = page.getByRole('button', { name: 'Execute', exact: true })
    this.status = page.getByTestId('transaction-status')
    this.submitActions = page.getByTestId('combo-submit-dropdown')
    this.addToBatchChoice = page.getByRole('menuitem', { name: 'Add to batch' })
    this.addToBatchButton = page.getByTestId('combo-submit-batching')
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true })
    this.closeButton = page.getByRole('dialog').getByRole('button', { name: 'close' })
    this.discardButton = page.getByRole('alertdialog').getByRole('button', { name: 'Discard' })
    this.signMessageButton = page.getByRole('button', { name: 'Sign', exact: true })
    this.signedMessageContinueButton = page.getByRole('button', { name: 'Continue', exact: true })
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

  /** Confirm the risk and execute the reviewed bulk with the connected wallet, not the relay */
  async executeBulk(): Promise<void> {
    await this.confirmRisk()
    await this.connectedWalletMethod.click()
    await this.submitButton.click()
  }

  /** Confirm the risk, continue from the review and execute a fully signed transaction with the connected wallet */
  async continueAndExecute(): Promise<void> {
    await this.confirmRisk()
    await this.continueButton.click()
    await this.execute()
  }

  /** Close the flow and confirm "Discard this transaction?"; an app that asked for it gets a rejection */
  async discard(): Promise<void> {
    await this.closeButton.click()
    await this.discardButton.click()
  }

  /** Confirm the risk and sign a message of a 1/n Safe, then hand the signature to the app that asked for it */
  async signMessage(): Promise<void> {
    await this.confirmRisk()
    await this.signMessageButton.click()
    await this.signedMessageContinueButton.click()
  }

  /** Wait until the success screen reports the transaction as mined; the indexer may still be behind */
  async waitForExecution(): Promise<void> {
    await this.status.filter({ hasText: EXECUTED_STATUS }).waitFor({ timeout: EXECUTION_TIMEOUT_MS })
  }

  /** Wait until the success screen reports the transaction as indexed; the app has then reloaded the Safe nonce */
  async waitForIndexing(): Promise<void> {
    await this.status.filter({ hasText: 'Transaction was successful' }).waitFor({ timeout: EXECUTION_TIMEOUT_MS })
  }

  private async confirmRisk(): Promise<void> {
    await this.riskConfirmation.click({ timeout: REVIEW_LOAD_TIMEOUT_MS })
  }
}
