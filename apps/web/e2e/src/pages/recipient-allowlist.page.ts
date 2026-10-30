/**
 * The recipient allowlist of a Workspace's Policies page: its setup flow, its row in the policies table and its panel.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test.
 */
import { type Locator, type Page } from '@playwright/test'
import { short } from '../../environment/scenarios/chain.mjs'

// The flow reads the Safe's guard slots and its tokens from the RPC and CGW before it offers the sections
const FORM_LOAD_TIMEOUT_MS = 30_000

export class RecipientAllowlistPage {
  /** The catalogue's tile, shown while the Workspace has no policies */
  readonly setPolicyButton: Locator
  /** The policies list's button, shown once the Workspace has policies */
  readonly addPolicyButton: Locator
  readonly safeAccountSelector: Locator
  readonly recipientsSection: Locator
  readonly nextButton: Locator
  /** One row per call of the reviewed transaction, in execution order: "<n> <target>: <method>" */
  readonly setupCalls: Locator
  /** The rules of the configuring call, listed once its row is expanded */
  readonly rules: Locator
  /** The panel of an allowlist, opened from its table row */
  readonly panel: Locator
  /** The panel's main action: opens the review of the apply, or of the queued transaction while it is signed */
  readonly reviewTransactionButton: Locator
  /** The panel's action while a requested change waits out the guard's delay, offered disabled */
  readonly disabledPanelAction: Locator

  constructor(private readonly page: Page) {
    this.setPolicyButton = page.getByRole('button', { name: 'Set policy: Recipient allowlist' })
    this.addPolicyButton = page.getByRole('button', { name: 'Add policy', exact: true })
    this.safeAccountSelector = page.getByTestId('safe-account-selector')
    this.recipientsSection = page.getByTestId('allowlist-recipients-section')
    this.nextButton = page.getByTestId('recipient-allowlist-create-step').getByTestId('next-btn')
    this.setupCalls = page.getByTestId('allowlist-setup-actions').getByTestId('action-item')
    this.rules = page.getByTestId('allowlist-setup-actions').getByTestId('allowlist-rule')
    this.panel = page.getByRole('dialog', { name: 'Allowlist' })
    this.reviewTransactionButton = this.panel.getByRole('button', { name: 'Review transaction' })
    this.disabledPanelAction = this.panel.getByRole('button', { disabled: true })
  }

  /** Starts the setup from the catalogue tile, through the intro that opens before every setup */
  async startFromCatalogue(): Promise<void> {
    await this.setPolicyButton.click()
    await this.proceedFromIntro()
  }

  /** Starts the setup from Add policy, when the Workspace already lists policies */
  async startFromAddPolicy(): Promise<void> {
    await this.addPolicyButton.click()
    await this.page
      .getByRole('dialog', { name: 'Add policy' })
      .getByRole('button', { name: /Recipient allowlist/ })
      .click()
    await this.proceedFromIntro()
  }

  /** The intro's Set up stays disabled until the owner confirms that every other action is blocked */
  private async proceedFromIntro(): Promise<void> {
    const intro = this.page.getByTestId('recipient-allowlist-intro-dialog')
    await intro.getByRole('checkbox', { name: /I understand that anything not allowed/ }).click()
    await intro.getByRole('button', { name: 'Set up allowlist' }).click()
  }

  async selectSafe(safeName: string): Promise<void> {
    await this.safeAccountSelector.click()
    await this.page.getByRole('option').filter({ hasText: safeName }).click()
  }

  /** The chip that allows `label`, a token symbol or a recipient's name; `aria-pressed` says whether it is allowed */
  allowChip(label: string): Locator {
    return this.page.getByRole('button', { name: `Allow ${label}`, exact: true })
  }

  /** Waits until the form lists the Safe's tokens, then leaves `symbol` out of the allowlist */
  async excludeToken(symbol: string): Promise<void> {
    await this.allowChip(symbol).click({ timeout: FORM_LOAD_TIMEOUT_MS })
  }

  /** Adds a named recipient with the inline row; the row is already open while the list is empty */
  async addRecipient({ name, address }: { name: string; address: string }): Promise<void> {
    const nameInput = this.recipientsSection.getByRole('textbox', { name: 'Name (optional)' })
    const addButton = this.recipientsSection.getByRole('button', { name: 'Add a recipient' })
    await nameInput.or(addButton).first().waitFor({ timeout: FORM_LOAD_TIMEOUT_MS })
    if (await addButton.isVisible()) await addButton.click()
    await nameInput.fill(name)
    await this.recipientsSection.getByRole('button', { name: 'Next', exact: true }).click()
    await this.recipientsSection.getByRole('textbox', { name: 'Address or ENS' }).fill(address)
    await this.recipientsSection.getByRole('button', { name: 'Add recipient' }).click()
  }

  /** The table row of the Safe's allowlist, found by the Safe's short address that it shows */
  row(safeAddress: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: 'Allowlist' })
      .filter({ hasText: short(safeAddress) })
  }

  async openPanel(safeAddress: string): Promise<void> {
    await this.page.getByRole('button', { name: `Open Allowlist for ${short(safeAddress)}` }).click()
  }

  /** The row of a requested change, queued or waiting out the delay; it is listed next to the live allowlist */
  pendingRow(safeAddress: string): Locator {
    return this.row(safeAddress).filter({ has: this.page.getByTestId('policy-cell-status').getByText('Pending') })
  }

  async openPendingPanel(safeAddress: string): Promise<void> {
    await this.pendingRow(safeAddress).getByTestId('policy-open-button').click()
  }

  async closePanel(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }
}
