/**
 * Policies page of a Workspace: the policy catalogue, the proposer policy form and the policies table.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Locator, type Page } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class PoliciesPage {
  readonly setProposerPolicyButton: Locator
  readonly safeAccountSelector: Locator
  readonly proposerInput: Locator
  readonly proposerNameInput: Locator
  readonly submitButton: Locator

  constructor(private readonly page: Page) {
    this.setProposerPolicyButton = page.getByRole('button', { name: 'Set policy: Proposer role' })
    this.safeAccountSelector = page.getByTestId('safe-account-selector')
    this.proposerInput = page.getByRole('combobox', { name: 'Proposer' })
    this.proposerNameInput = page.getByRole('textbox', { name: 'Proposer name' })
    this.submitButton = page.getByRole('button', { name: 'Submit' })
  }

  async goto(workspaceId: string): Promise<void> {
    await this.page.goto(`${ROUTES.spacesPolicies}?spaceId=${workspaceId}`)
  }

  /** Opens the proposer policy form; the first time, the intro dialog comes before it */
  async openProposerForm(): Promise<void> {
    await this.setProposerPolicyButton.click()
    await this.page.getByRole('button', { name: 'Set up proposer' }).click()
  }

  /** The Safe accounts that the form offers, after it opens the list */
  async safeAccountOptions(): Promise<Locator> {
    await this.safeAccountSelector.click()
    return this.page.getByRole('option')
  }

  /** Fills the open form and submits it; the connected wallet signs the delegation */
  async addProposer({ safeName, proposer, name }: { safeName: string; proposer: string; name: string }) {
    const options = await this.safeAccountOptions()
    await options.filter({ hasText: safeName }).click()
    await this.proposerInput.fill(proposer)
    await this.proposerNameInput.fill(name)
    await this.submitButton.click()
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
