/**
 * Policies page of a Workspace: the policy catalogue, the proposer and spending-limit policy forms and the policies table.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Locator, type Page } from '@playwright/test'
import { ROUTES } from '../data/constants'
import { TokenSelectorField } from './token-selector.page'

export class PoliciesPage {
  readonly setProposerPolicyButton: Locator
  readonly setSpendingLimitPolicyButton: Locator
  readonly safeAccountSelector: Locator
  readonly proposerInput: Locator
  readonly proposerNameInput: Locator
  readonly submitButton: Locator
  readonly spenderInput: Locator
  readonly tokenSelector: TokenSelectorField
  readonly limitAmountInput: Locator
  readonly nextButton: Locator

  constructor(private readonly page: Page) {
    this.setProposerPolicyButton = page.getByRole('button', { name: 'Set policy: Proposer role' })
    this.setSpendingLimitPolicyButton = page.getByRole('button', { name: 'Set policy: Spending limit' })
    this.safeAccountSelector = page.getByTestId('safe-account-selector')
    this.proposerInput = page.getByRole('combobox', { name: 'Proposer' })
    this.proposerNameInput = page.getByRole('textbox', { name: 'Proposer name' })
    this.submitButton = page.getByRole('button', { name: 'Submit' })
    this.spenderInput = page.getByRole('combobox', { name: 'Spender', exact: true })
    this.tokenSelector = new TokenSelectorField(page)
    this.limitAmountInput = page.getByLabel('Limit amount')
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true })
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.spacesPolicies}?spaceId=${workspaceId}`)
  }

  /** Opens the proposer policy form; the first time, the intro dialog comes before it */
  async openProposerForm(): Promise<void> {
    await this.setProposerPolicyButton.click()
    await this.page.getByRole('button', { name: 'Set up proposer' }).click()
  }

  /** Opens the spending-limit policy form; the first time, the intro dialog comes before it */
  async openSpendingLimitForm(): Promise<void> {
    await this.setSpendingLimitPolicyButton.click()
    await this.page.getByRole('button', { name: 'Set up spending limit' }).click()
  }

  /** The Safe accounts that the form offers, after it opens the list */
  async safeAccountOptions(): Promise<Locator> {
    await this.safeAccountSelector.click()
    return this.page.getByRole('option')
  }

  async chooseSafeAccount(safeName: string): Promise<void> {
    const options = await this.safeAccountOptions()
    await options.filter({ hasText: safeName }).click()
  }

  /** Fills the open form and submits it; the connected wallet signs the delegation */
  async addProposer({ safeName, proposer, name }: { safeName: string; proposer: string; name: string }) {
    await this.chooseSafeAccount(safeName)
    await this.proposerInput.fill(proposer)
    await this.proposerNameInput.fill(name)
    await this.submitButton.click()
  }

  /** Fills the open form with one spender and one limit of a pasted token, and goes on to the review */
  async addSpendingLimitOnPastedToken({
    safeName,
    spender,
    token,
    amount,
  }: {
    safeName: string
    spender: string
    token: { address: string; symbol: string }
    amount: string
  }): Promise<void> {
    await this.chooseSafeAccount(safeName)
    await this.spenderInput.fill(spender)
    await this.tokenSelector.pickPastedToken(token)
    await this.limitAmountInput.fill(amount)
    await this.nextButton.click()
  }

  /** The table row of a proposer policy, found by the proposer's short address that it shows */
  proposerRow(address: string): Locator {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return this.page.getByRole('row').filter({ hasText: shortAddress })
  }

  /** Opens the policy from its row and removes it; the connected wallet signs the removal */
  async removeProposer(address: string): Promise<void> {
    await this.proposerRow(address).getByTestId('policy-open-button').click()
    await this.page.getByRole('button', { name: 'Remove proposer' }).click()
    await this.page.getByRole('button', { name: 'Yes, delete' }).click()
  }
}
