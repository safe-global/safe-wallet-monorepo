import { type Page, type Locator } from '@playwright/test'
import { short } from '../../environment/scenarios/chain.mjs'

const EXECUTED_STATUS = /Transaction was (processed|successful)/

export class TxReviewPage {
  /** "I understand the risks": Safe Shield asks for it on a critical finding, e.g. a Safe not in the user's accounts */
  readonly riskConfirmation: Locator
  readonly continueButton: Locator
  /** Shown to an owner of a parent Safe, which can sign for the child Safe */
  readonly signerSelect: Locator
  readonly signButton: Locator
  /** A proposer who is not a signer gets this button in place of the sign step */
  readonly proposeButton: Locator
  readonly connectedWalletMethod: Locator
  readonly relayMethod: Locator
  /** "<n> free transactions left today" next to the relay option */
  readonly remainingRelays: Locator
  /** The sponsored transactions left: the free daily ones, or "<left>/<quota>" of a Workspace plan */
  readonly sponsoredTxsCounter: Locator
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
  /** The Ledger dialog, open while the device reviews a transaction */
  readonly hashComparisonDialog: Locator
  /** The rows of a batch review, one per batched transaction, in batch order */
  readonly batchedTransactions: Locator
  /** The accordion that shows the transaction's method, e.g. `multiSend` */
  readonly transactionDetails: Locator
  readonly noteInput: Locator
  /** In the toast after a proposal, which hides itself after 5 s */
  readonly viewTransactionLink: Locator

  constructor(private readonly page: Page) {
    this.riskConfirmation = page.getByTestId('risk-confirmation-checkbox')
    this.continueButton = page.getByTestId('continue-sign-btn')
    this.signerSelect = page.getByRole('combobox', { name: 'Signer account' })
    this.signButton = page.getByTestId('combo-submit-sign')
    this.proposeButton = page.getByRole('button', { name: 'Propose transaction' })
    this.connectedWalletMethod = page.getByTestId('connected-wallet-execution-method')
    this.relayMethod = page.getByTestId('relay-execution-method').first()
    this.remainingRelays = page.getByText(/free transactions? left today/)
    this.sponsoredTxsCounter = page.getByTestId('sponsored-txs-counter')
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
    this.hashComparisonDialog = page.getByRole('dialog', { name: 'Compare transaction hash' })
    this.batchedTransactions = page.getByRole('listitem').getByTestId('action-item')
    this.transactionDetails = page.getByRole('button', { name: /^Transaction details/ })
    this.noteInput = page.getByLabel('Note')
    this.viewTransactionLink = page
      .getByRole('alert')
      .filter({ hasText: 'Successfully added to queue' })
      .getByRole('link', { name: 'View transaction' })
  }

  async addNote(note: string): Promise<void> {
    await this.noteInput.fill(note)
  }

  /** The decoded call at `position` (from 1) in the "All actions" list of a multiSend review */
  multiSendAction(position: number): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${position} `) })
  }

  /** Continue from the review and sign with the connected wallet */
  async sign(): Promise<void> {
    await this.continueButton.click()
    await this.signButton.click()
  }

  /** Wait until the signer select shows `address`; it fills in once CGW returns the wallet's Safes */
  async waitForSigner(address: string): Promise<void> {
    await this.signerSelect.filter({ hasText: short(address) }).waitFor()
  }

  /** The option for `address` in the open signer select, with an "Already signed" pill when it has signed */
  signerOption(address: string): Locator {
    return this.page.getByRole('option', { name: short(address) })
  }

  /** Pick `address` in the signer select */
  async chooseSigner(address: string): Promise<void> {
    await this.signerSelect.click()
    await this.signerOption(address).click()
  }

  /** Continue from the review and propose the transaction as a proposer, without a signature */
  async propose(): Promise<void> {
    await this.continueButton.click()
    await this.proposeButton.click()
  }

  /** Sign as the only signer that the threshold needs, execute with the connected wallet and wait until it is mined */
  async signAndExecute(): Promise<void> {
    await this.sign()
    await this.execute()
    await this.waitForExecution()
  }

  /** Execute a fully signed transaction with the relay, which pays the gas */
  async executeWithRelay(): Promise<void> {
    await this.relayMethod.click()
    await this.executeButton.click()
  }

  /** Execute a fully signed transaction with the connected wallet, not the relay */
  async execute(): Promise<void> {
    await this.connectedWalletMethod.click()
    await this.executeButton.click()
  }

  /** Continue from the review and add the transaction to the batch instead of signing it */
  async addToBatch(): Promise<void> {
    await this.continueButton.click()
    await this.submitActions.click()
    await this.addToBatchChoice.click()
    await this.addToBatchButton.click()
  }

  /** Execute the reviewed bulk with the connected wallet, not the relay */
  async executeBulk(): Promise<void> {
    await this.connectedWalletMethod.click()
    await this.submitButton.click()
  }

  /** Continue from the review and execute a fully signed transaction with the connected wallet */
  async continueAndExecute(): Promise<void> {
    await this.continueButton.click()
    await this.execute()
  }

  /** Close the flow and confirm "Discard this transaction?"; an app that asked for it gets a rejection */
  async discard(): Promise<void> {
    await this.closeButton.click()
    await this.discardButton.click()
  }

  /** Sign a message of a 1/n Safe, then hand the signature to the app that asked for it */
  async signMessage(): Promise<void> {
    await this.signMessageButton.click()
    await this.signedMessageContinueButton.click()
  }

  /** Wait until the success screen reports the transaction as mined; the indexer may still be behind */
  async waitForExecution(): Promise<void> {
    await this.status.filter({ hasText: EXECUTED_STATUS }).waitFor()
  }

  /** Wait until the success screen reports the transaction as indexed; the app has then reloaded the Safe nonce */
  async waitForIndexing(): Promise<void> {
    await this.status.filter({ hasText: 'Transaction was successful' }).waitFor()
  }

  /** Tick the risk confirmation, which a Safe that is not in the user's accounts needs before it can continue */
  async confirmRisk(): Promise<void> {
    await this.riskConfirmation.click()
  }
}
