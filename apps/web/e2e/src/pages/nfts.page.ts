import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class NftsPage {
  readonly rows: Locator
  readonly sendButton: Locator
  readonly recipientInput: Locator
  readonly nextButton: Locator

  constructor(private readonly page: Page) {
    this.rows = page.locator('[data-testid^="nfts-table-row-"]')
    this.sendButton = page.getByTestId('nft-send-btn-false')
    this.recipientInput = page.getByTestId('address-book-input').getByRole('combobox')
    this.nextButton = page.getByRole('button', { name: 'Next' })
  }

  /** Open the NFT list of the Safe (`sep:0x…`) */
  async goto(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.balancesNfts}?safe=${safe}`)
  }

  /** The row of the NFT that the list labels `CF #0` (symbol and token ID) */
  nft(label: string): Locator {
    return this.rows.filter({ has: this.page.getByText(label, { exact: true }) })
  }

  /** Select the NFTs by their labels and send them to `recipient`; the review opens */
  async send({ labels, recipient }: { labels: string[]; recipient: string }): Promise<void> {
    for (const label of labels) await this.nft(label).getByRole('checkbox').click()
    await this.sendButton.click()
    await this.recipientInput.fill(recipient)
    await this.nextButton.click()
  }
}
