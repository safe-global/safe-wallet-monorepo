/**
 * Spending limits section of Settings → Setup and its New spending limit form.
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

  constructor(private readonly page: Page) {
    this.section = page.getByTestId('spending-limit-section')
    this.addButton = this.section.getByRole('button', { name: 'Add spending limit' })
    this.spentAmounts = this.section.getByTestId('spent-amount')
    this.beneficiaryInput = page.getByRole('combobox', { name: 'Beneficiary' })
    this.tokenSelector = new TokenSelectorField(page)
    this.amountInput = page.getByLabel('Limit amount')
    this.nextButton = page.getByRole('button', { name: 'Next' })
  }

  /** Opens the settings inside the Workspace, whose plan decides whether spending limits can be added */
  async goto(safe: string, workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.settingsSetup}?safe=${safe}&spaceId=${workspaceId}`)
    await this.section.waitFor()
  }

  /** Fills the open form with a beneficiary and a limit of a pasted token, and goes on to the review */
  async addLimitOnPastedToken({
    beneficiary,
    token,
    amount,
  }: {
    beneficiary: string
    token: { address: string; symbol: string }
    amount: string
  }): Promise<void> {
    await this.beneficiaryInput.fill(beneficiary)
    await this.tokenSelector.pickPastedToken(token)
    await this.amountInput.fill(amount)
    await this.nextButton.click()
  }
}
