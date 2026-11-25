/**
 * The spending-limit token picker, in the Workspace policy form and in the Safe settings form.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Locator, type Page } from '@playwright/test'

export class TokenSelectorField {
  readonly input: Locator
  readonly customTokenGroup: Locator
  readonly tokenUnknown: Locator

  constructor(private readonly page: Page) {
    this.input = page.getByRole('combobox', { name: 'Token', exact: true })
    this.customTokenGroup = page.getByRole('group', { name: 'Custom token' })
    this.tokenUnknown = page.getByText('Token unknown.')
  }

  /** Pastes an address into the token field, which looks it up when no list offers it */
  async paste(address: string): Promise<void> {
    await this.input.fill(address)
  }

  /** Pastes a token address that the lists do not offer and picks the token that the lookup finds for it */
  async pickPastedToken({ address, symbol }: { address: string; symbol: string }): Promise<void> {
    await this.paste(address)
    await this.customTokenGroup.getByRole('option', { name: symbol }).click()
  }

  /** Opens the list and picks a token from the "Popular" group */
  async pickPopularToken(symbol: string): Promise<void> {
    await this.input.click()
    await this.page.getByRole('group', { name: 'Popular' }).getByRole('option', { name: symbol }).click()
  }
}
