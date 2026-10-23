/**
 * Network Selector Page Object — the network menu in the header of a Safe: it switches to the Safe on another of its
 * networks, or adds the Safe to a network where it does not exist yet.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'

export class NetworkSelector {
  readonly trigger: Locator
  readonly allNetworks: Locator
  readonly addNetworkButton: Locator

  constructor(private readonly page: Page) {
    this.trigger = page.getByTestId('space-chain-navigation-button')
    this.allNetworks = page.getByTestId('all-networks-accordion-trigger')
    this.addNetworkButton = page.getByTestId('modal-add-network-btn')
  }

  /** Open the Safe's dashboard on `network`, one of the networks that the Safe has, e.g. 'Ethereum' */
  async switchTo(network: string): Promise<void> {
    await this.trigger.click()
    await this.page.getByRole('button', { name: network, exact: true }).click()
  }

  /** Add the Safe to `network` with the setup of its creation, and wait until the dialog closes */
  async addNetwork(network: string): Promise<void> {
    await this.trigger.click()
    await this.allNetworks.click()
    await this.page.getByRole('button', { name: `Add ${network}`, exact: true }).click()
    await this.addNetworkButton.click()
    await this.addNetworkButton.waitFor({ state: 'hidden' })
  }
}
