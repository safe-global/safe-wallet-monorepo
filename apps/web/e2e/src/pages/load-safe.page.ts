/**
 * Load Safe Page Object — "Add existing Safe account": the address step, the signers step and the review.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class LoadSafePage {
  readonly safeName: Locator
  readonly safeAddress: Locator
  readonly addressNextButton: Locator
  readonly signerNames: Locator
  readonly nextButton: Locator
  readonly addButton: Locator
  /** The Safe name in the safe selector of the sidebar */
  readonly sidebarSafeName: Locator

  constructor(private readonly page: Page) {
    this.safeName = page.getByRole('textbox', { name: 'Name' })
    this.safeAddress = page.getByRole('textbox', { name: 'Safe account' })
    this.addressNextButton = page.getByTestId('load-safe-next-btn')
    this.signerNames = page.getByRole('textbox', { name: 'Signer name' })
    this.nextButton = page.getByRole('button', { name: 'Next' })
    this.addButton = page.getByRole('button', { name: 'Add', exact: true })
    this.sidebarSafeName = page.getByTestId('safe-selector-trigger-name')
  }

  /** Open the load flow on Sepolia */
  async goto(): Promise<void> {
    await this.page.goto(`${ROUTES.loadSafe}?chain=sep`)
  }

  /** Name the Safe at `address` and continue to the signers step once CGW confirms it is a Safe */
  async enterSafe({ name, address }: { name: string; address: string }): Promise<void> {
    await this.safeName.fill(name)
    await this.safeAddress.fill(address)
    await this.addressNextButton.click()
  }
}
