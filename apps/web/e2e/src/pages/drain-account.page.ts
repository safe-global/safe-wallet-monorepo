/**
 * Drain Account Page Object — the Safe App from apps/drain-safe, which the isolated stack serves on port 4001,
 * opened in its iframe in the wallet.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type FrameLocator, type Page } from '@playwright/test'
import { LS_NAMESPACE } from '../data/constants'

// The URL that the local config service lists for Drain Account
export const DRAIN_ACCOUNT_URL = 'http://localhost:4001'

export class DrainAccountPage {
  readonly app: FrameLocator

  constructor(private readonly page: Page) {
    this.app = page.frameLocator(`iframe[id="iframe-${encodeURIComponent(DRAIN_ACCOUNT_URL)}"]`)
  }

  /** Open Drain Account for the Safe (`sep:0x…`), with the Safe Apps disclaimer accepted */
  async open(safe: string): Promise<void> {
    await this.page.addInitScript((ns) => {
      const infoModal = { 11155111: { consentsAccepted: true, warningCheckedCustomApps: [] } }
      window.localStorage.setItem(`${ns}SafeApps__infoModal`, JSON.stringify(infoModal))
    }, LS_NAMESPACE)
    await this.page.goto(`/apps/open?safe=${safe}&appUrl=${encodeURIComponent(DRAIN_ACCOUNT_URL)}`)
  }

  /** Send every listed asset to `recipient` as one batch to the wallet */
  async transferEverythingTo(recipient: string): Promise<void> {
    await this.app.getByLabel('Recipient').fill(recipient)
    await this.app.getByRole('button', { name: 'Transfer everything' }).click()
  }
}
