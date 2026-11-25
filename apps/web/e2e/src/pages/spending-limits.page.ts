/**
 * Spending limits section of Settings → Setup, its New spending limit form and the review step.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'
import { TokenSelectorField } from './token-selector.page'

export class SpendingLimitsPage {
  readonly section: Locator
  readonly addButton: Locator
  /** "<spent> of <amount> <symbol>" of each limit in the table */
  readonly spentAmounts: Locator
  readonly beneficiaryInput: Locator
  readonly tokenSelector: TokenSelectorField
  readonly amountInput: Locator
  readonly nextButton: Locator
  /** Under the token field once an untrusted token is picked, and again on the review step */
  readonly untrustedTokenWarning: Locator

  constructor(private readonly page: Page) {
    this.section = page.getByTestId('spending-limit-section')
    this.addButton = this.section.getByRole('button', { name: 'Add spending limit' })
    this.spentAmounts = this.section.getByTestId('spent-amount')
    this.beneficiaryInput = page.getByRole('combobox', { name: 'Beneficiary' })
    this.tokenSelector = new TokenSelectorField(page)
    this.amountInput = page.getByLabel('Limit amount')
    this.nextButton = page.getByRole('button', { name: 'Next' })
    this.untrustedTokenWarning = page.getByText('Token not trusted, we maintain a list. At your own risk.')
  }

  /** Opens the settings inside the Workspace, whose plan decides whether spending limits can be added */
  async goto(safe: string, workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.settingsSetup}?safe=${safe}&spaceId=${workspaceId}`)
    await this.section.waitFor()
  }

  /** Opens the form and fills the beneficiary; the token is picked by the test */
  async startLimit(beneficiary: string): Promise<void> {
    await this.addButton.click()
    await this.beneficiaryInput.fill(beneficiary)
  }

  /** Fills the amount of the picked token and goes on to the review */
  async finishLimit(amount: string): Promise<void> {
    await this.amountInput.fill(amount)
    await this.nextButton.click()
  }
}
