/**
 * Send-tokens Page Object — "New transaction → Send tokens" and the first step
 * of the flow (recipient, amount, token, Next).
 */
import { type Page, type Locator } from '@playwright/test'

export class SendTokensPage {
  readonly newTxButton: Locator
  readonly sendTokensButton: Locator

  /** Editable recipient combobox — present until a contact is picked. */
  readonly recipientInput: Locator
  readonly recipientCaret: Locator
  /** The focusable wrapper around the chip — the chip's own testid sits one level inside it. */
  readonly recipientChip: Locator
  readonly recipientChipValue: Locator
  readonly suggestionList: Locator
  readonly suggestions: Locator
  /** "Contacts of <workspace>" / "Local contacts" headers inside the suggestion list. */
  readonly suggestionGroupHeaders: Locator

  readonly amountField: Locator
  readonly maxButton: Locator
  readonly tokenSelector: Locator
  readonly addRecipientButton: Locator
  readonly nextButton: Locator
  readonly spendingLimitOption: Locator

  constructor(readonly page: Page) {
    this.newTxButton = page.getByTestId('new-tx-btn')
    this.sendTokensButton = page.getByTestId('send-tokens-btn')

    const recipientField = page.getByTestId('address-book-input')
    this.recipientInput = recipientField.getByRole('combobox')
    this.recipientCaret = page.getByTestId('address-book-toggle')
    this.recipientChipValue = page.getByTestId('address-book-recipient')
    this.recipientChip = recipientField.getByRole('button').filter({ has: page.getByTestId('address-book-recipient') })
    this.suggestionList = page.getByRole('listbox')
    this.suggestions = page.getByTestId('address-item')
    this.suggestionGroupHeaders = page.getByTestId('contact-group-header')

    this.amountField = page.getByTestId('token-amount-field')
    this.maxButton = page.getByTestId('max-btn')
    this.tokenSelector = page.getByTestId('token-selector').getByRole('combobox')
    this.addRecipientButton = page.getByTestId('add-recipient-btn')
    this.nextButton = page.getByRole('button', { name: 'Next' })
    this.spendingLimitOption = page.getByTestId('spending-limit-tx')
  }

  /** Open the send-tokens form from the dashboard. Returns once the recipient field is on screen. */
  async open(): Promise<void> {
    await this.newTxButton.click()
    await this.sendTokensButton.click()
    await this.recipientInput.waitFor({ state: 'visible' })
  }

  /** Enter the recipient's address and an amount of the selected token */
  async fillTransfer({ recipient, amount }: { recipient: string; amount: string }): Promise<void> {
    await this.recipientInput.fill(recipient)
    await this.amountField.fill(amount)
  }

  /** A single suggestion, matched by the contact name or address it renders. */
  suggestion(text: string): Locator {
    return this.suggestions.filter({ hasText: text })
  }

  /** Enter the recipient's address and amount in the recipient row at `row`, counted from 0 */
  async fillTransferAt(row: number, { recipient, amount }: { recipient: string; amount: string }): Promise<void> {
    await this.page.getByTestId('address-book-input').nth(row).getByRole('combobox').fill(recipient)
    await this.amountField.nth(row).fill(amount)
  }
}
