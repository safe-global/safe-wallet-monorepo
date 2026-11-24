/**
 * The spending-limit token picker, in the Workspace policy form and in the Safe settings form.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Locator, type Page } from '@playwright/test'

export class TokenSelectorField {
  readonly input: Locator

  constructor(private readonly page: Page) {
    this.input = page.getByRole('combobox', { name: 'Token', exact: true })
  }

  /** Pastes a token address that the lists do not offer and picks the token that the lookup finds for it */
  async pickPastedToken({ address, symbol }: { address: string; symbol: string }): Promise<void> {
    await this.input.fill(address)
    await this.page.getByRole('group', { name: 'Custom token' }).getByRole('option', { name: symbol }).click()
  }
}
