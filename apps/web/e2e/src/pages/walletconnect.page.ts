/**
 * WalletConnect Page Object — the header popover where the user pastes a dApp's pairing code and approves the
 * session proposal.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the
 * test file, never here. Waiting (waitFor / waitForResponse) is allowed.
 */
import { type Page, type Locator } from '@playwright/test'

export class WalletConnectPage {
  readonly headerButton: Locator
  readonly pairingInput: Locator
  readonly approveButton: Locator

  constructor(private readonly page: Page) {
    this.headerButton = page.getByRole('button', { name: 'WalletConnect' })
    this.pairingInput = page.getByTestId('wc-input')
    this.approveButton = page.getByRole('button', { name: 'Approve' })
  }

  /** The proposal's "<name> wants to connect" heading. */
  proposal(dappName: string): Locator {
    return this.page.getByText(`${dappName} wants to connect`)
  }

  /** The row of a connected dApp in the popover's session list. */
  session(dappName: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: dappName })
  }

  /** Opens the popover and pastes the pairing code; the dApp's proposal then replaces the input. */
  async pair(uri: string): Promise<void> {
    await this.headerButton.click()
    await this.pairingInput.fill(uri)
  }

  /** Opens the popover, unless it is already open. */
  async open(): Promise<void> {
    if (!(await this.pairingInput.isVisible())) await this.headerButton.click()
  }
}
