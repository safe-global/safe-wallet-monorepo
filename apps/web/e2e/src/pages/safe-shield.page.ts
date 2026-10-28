import { type Page, type Locator } from '@playwright/test'

// The cards appear once the gateway and the RPC have answered the checks
const ANALYSIS_TIMEOUT_MS = 60_000

/** The Safe Shield widget beside a transaction review */
export class SafeShieldPage {
  /** The Safe Pro recipient card; its header shows the most severe finding, the findings show when it is expanded */
  readonly recipientCard: Locator
  /** The critical finding for a Safe that is not in the user's accounts */
  readonly untrustedSafeFinding: Locator

  constructor(page: Page) {
    const widget = page.getByTestId('safe-shield-widget')
    this.recipientCard = widget.getByTestId('recipient-analysis-group-card')
    this.untrustedSafeFinding = widget.getByText('Not in your accounts', { exact: true })
  }

  /** Expand the recipient card to list one finding per check */
  async expandRecipientCard(): Promise<void> {
    await this.recipientCard.click({ timeout: ANALYSIS_TIMEOUT_MS })
  }

  /** The recipient finding with this description, as the gateway or the browser check words it */
  recipientFinding(description: string): Locator {
    return this.recipientCard.getByText(description, { exact: true })
  }
}
