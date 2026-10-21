import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class MessagesPage {
  readonly messages: Locator
  readonly riskConfirmation: Locator
  /** The Sign button of the sign message modal */
  readonly modalSignButton: Locator

  constructor(private readonly page: Page) {
    this.messages = page.getByTestId('message-item')
    this.riskConfirmation = page.getByTestId('risk-confirmation-checkbox')
    this.modalSignButton = page.getByRole('dialog').getByRole('button', { name: 'Sign', exact: true })
  }

  /** Open the off-chain messages of the Safe (`sep:0x…`) */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.transactionsMessages}?safe=${safe}`)
  }

  /** The list row of the message with this text */
  message(text: string): Locator {
    return this.messages.filter({ hasText: text })
  }

  /** Open the sign modal from the message row, confirm the risk and sign with the connected wallet */
  async sign(text: string): Promise<void> {
    await this.message(text).getByRole('button', { name: 'Sign', exact: true }).click()
    await this.riskConfirmation.click()
    await this.modalSignButton.click()
  }
}
