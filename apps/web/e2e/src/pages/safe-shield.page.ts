import { type Page, type Locator } from '@playwright/test'

// The recipient card appears once CGW and the RPC have answered the recipient checks
const ANALYSIS_TIMEOUT_MS = 60_000

/** The Safe Shield widget beside a transaction review */
export class SafeShieldPage {
  /** The Safe Pro recipient card; its header shows the most severe finding, the findings show when it is expanded */
  readonly recipientCard: Locator

  constructor(page: Page) {
    this.recipientCard = page.getByTestId('safe-shield-widget').getByTestId('recipient-analysis-group-card')
  }

  /** Expand the recipient card to list one finding per check */
  async expandRecipientCard(): Promise<void> {
    await this.recipientCard.click({ timeout: ANALYSIS_TIMEOUT_MS })
  }

  /** The recipient finding with this description, as CGW or the browser check words it */
  recipientFinding(description: string): Locator {
    return this.recipientCard.getByText(description, { exact: true })
  }
}
