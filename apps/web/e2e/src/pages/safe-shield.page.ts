import { type Page, type Locator } from '@playwright/test'

// The cards appear once the gateway and the RPC have answered the checks
const ANALYSIS_TIMEOUT_MS = 60_000

/** The Safe Shield widget beside a transaction review */
export class SafeShieldPage {
  /** The header: "Risk detected", "Issues found", "<n> of <m> checks passed", … */
  readonly status: Locator
  /** The Safe Pro recipient card; its header shows the most severe finding, the findings show when it is expanded */
  readonly recipientCard: Locator
  /** The Blockaid result: "Malicious threat detected", "No threat detected" or "Threat analysis failed" */
  readonly threatCard: Locator
  readonly untrustedSafeWarning: Locator
  readonly addToAccountsButton: Locator
  readonly confirmAddToAccountsButton: Locator

  constructor(page: Page) {
    const widget = page.getByTestId('safe-shield-widget')
    this.status = page.getByTestId('safe-shield-status')
    this.recipientCard = widget.getByTestId('recipient-analysis-group-card')
    this.threatCard = page.getByTestId('threat-analysis-group-card')
    this.untrustedSafeWarning = page.getByTestId('untrusted-safe-warning')
    this.addToAccountsButton = this.untrustedSafeWarning.getByRole('button', { name: 'Add to my accounts' })
    this.confirmAddToAccountsButton = page.getByTestId('confirm-add-trusted-safe-button')
  }

  /** Expand the recipient card to list one finding per check */
  async expandRecipientCard(): Promise<void> {
    await this.recipientCard.click({ timeout: ANALYSIS_TIMEOUT_MS })
  }

  /** The recipient finding with this description, as the gateway or the browser check words it */
  recipientFinding(description: string): Locator {
    return this.recipientCard.getByText(description, { exact: true })
  }

  /** Wait until the threat analysis card shows the scan's result */
  async waitForThreatAnalysis(): Promise<void> {
    await this.threatCard.waitFor({ timeout: ANALYSIS_TIMEOUT_MS })
  }

  /** Add the Safe to the user's accounts, so its only risk to confirm is what the analyses find */
  async addSafeToAccounts(): Promise<void> {
    await this.addToAccountsButton.click()
    await this.confirmAddToAccountsButton.click()
    await this.untrustedSafeWarning.waitFor({ state: 'hidden' })
  }
}
