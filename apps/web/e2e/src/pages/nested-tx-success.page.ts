import { type Page, type Locator } from '@playwright/test'

/** The success screen after a parent Safe signed for its child Safe: the parent still has to execute */
export class NestedTxSuccessPage {
  readonly status: Locator
  readonly openTransactionLink: Locator

  constructor(private readonly page: Page) {
    this.status = page.getByTestId('transaction-status')
    this.openTransactionLink = page.getByRole('link', { name: 'Open the transaction' })
  }

  /** Follow "Open the transaction" in this page, not in the new tab that the app opens */
  async openParentTransaction(): Promise<void> {
    const href = await this.openTransactionLink.getAttribute('href')
    if (!href) throw new Error('"Open the transaction" has no link to the parent transaction')
    await this.page.goto(href)
  }
}
