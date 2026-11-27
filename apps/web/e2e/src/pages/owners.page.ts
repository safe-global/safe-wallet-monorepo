/**
 * Owners Page Object — Settings → Setup: the signer list, the required confirmations, and the flows that change them
 * ("Manage signers", and Replace and Remove on a signer row). Each action stops when the review opens.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class OwnersPage {
  readonly signerList: Locator
  /** "<threshold> out of <owners> signer(s)." under Required confirmations */
  readonly requiredConfirmations: Locator
  readonly manageSignersButton: Locator
  readonly addSignerButton: Locator
  readonly thresholdSelector: Locator
  readonly nextButton: Locator
  /** The name field of the signer row that "Add new signer" adds; its placeholder is the address's ENS name */
  readonly newSignerName: Locator

  constructor(private readonly page: Page) {
    this.signerList = page.getByTestId('signer-list')
    this.requiredConfirmations = page.getByText(/^\d+ out of \d+ signers?\.$/)
    this.manageSignersButton = page.getByTestId('manage-signers-btn')
    this.addSignerButton = page.getByTestId('add-new-signer')
    this.thresholdSelector = page.getByTestId('threshold-selector')
    this.nextButton = page.getByRole('button', { name: 'Next' })
    this.newSignerName = page.getByRole('textbox', { name: 'Signer name' }).last()
  }

  /** Open Settings → Setup of the Safe (`sep:0x…`) */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.settingsSetup}?safe=${safe}`)
  }

  /** "Manage signers": add a signer row and type `newSigner` as its address */
  async enterNewSigner(newSigner: string): Promise<void> {
    await this.manageSignersButton.click()
    await this.addSignerButton.click()
    await this.page.getByTestId('address-book-input').last().getByRole('combobox').fill(newSigner)
  }

  /** "Manage signers": add `newSigner`, require `threshold` confirmations and continue to the review */
  async addSigner({ newSigner, threshold }: { newSigner: string; threshold: number }): Promise<void> {
    await this.enterNewSigner(newSigner)
    await this.thresholdSelector.click()
    await this.page.getByRole('option', { name: String(threshold), exact: true }).click()
    await this.nextButton.click()
  }

  /** Replace the signer `oldSigner` with `newSigner` and continue to the review */
  async replaceSigner({ oldSigner, newSigner }: { oldSigner: string; newSigner: string }): Promise<void> {
    await this.signerRow(oldSigner).getByRole('button', { name: 'Replace signer' }).click()
    await this.page.getByTestId('address-book-input').getByRole('combobox').fill(newSigner)
    await this.nextButton.click()
  }

  /** Remove the signer `signer`, keep the threshold that the flow suggests and continue to the review */
  async removeSigner(signer: string): Promise<void> {
    await this.signerRow(signer).getByRole('button', { name: 'Remove signer' }).click()
    await this.nextButton.click()
  }

  private signerRow(address: string): Locator {
    return this.signerList.getByRole('row').filter({ hasText: address })
  }
}
