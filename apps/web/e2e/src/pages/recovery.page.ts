import { type Page, type Locator } from '@playwright/test'
import { ROUTES } from '../data/constants'

export class RecoveryPage {
  readonly setupButton: Locator
  readonly editButton: Locator
  readonly removeButton: Locator
  readonly nextButton: Locator
  readonly addressInput: Locator
  readonly delaySelect: Locator
  readonly termsCheckbox: Locator
  /** The settings table of recoverers, with their review window and expiry */
  readonly recoverers: Locator
  readonly proposalCard: Locator
  readonly startRecoveryButton: Locator
  readonly proposeButton: Locator
  /** The dashboard card that tells owners and the recoverer about a pending proposal and its review window */
  readonly inProgressCard: Locator
  readonly actionRequiredToggle: Locator
  readonly goToQueueButton: Locator
  readonly queuedRecoveries: Locator
  readonly executeButton: Locator
  readonly confirmExecuteButton: Locator
  readonly cancelButton: Locator
  readonly confirmCancelButton: Locator

  constructor(private readonly page: Page) {
    this.setupButton = page.getByTestId('setup-recovery-btn')
    this.editButton = page.getByTestId('edit-recoverer-btn')
    this.removeButton = page.getByTestId('remove-recoverer-btn')
    this.nextButton = page.getByTestId('next-btn')
    this.addressInput = page.getByTestId('address-book-input').getByRole('combobox')
    this.delaySelect = page.getByTestId('recovery-delay-select')
    this.termsCheckbox = page.getByTestId('warning-section').getByRole('checkbox')
    this.recoverers = page.getByRole('table')
    this.proposalCard = page.getByTestId('recovery-proposal')
    this.startRecoveryButton = this.proposalCard.getByTestId('start-recovery')
    this.proposeButton = page.getByTestId('execute-btn')
    this.inProgressCard = page.getByTestId('recovery-in-progress-card')
    this.actionRequiredToggle = page.getByTestId('action-required-panel-toggle')
    this.goToQueueButton = page.getByTestId('queue-btn')
    this.queuedRecoveries = page.getByTestId('recovery-item')
    this.executeButton = this.queuedRecoveries.getByTestId('execute-btn')
    this.confirmExecuteButton = page.getByTestId('execute-through-role-form-btn')
    this.cancelButton = page.getByTestId('cancel-recovery-btn')
    this.confirmCancelButton = page.getByTestId('cancel-proposal-btn')
  }

  /** Open the security settings of the Safe (`sep:0x…`), where the recovery setup is */
  async gotoSettings(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.settings}/security?safe=${safe}`)
  }

  /** Open the owners settings of the Safe (`sep:0x…`) */
  async gotoOwners(safe: string): Promise<void> {
    await this.page.goto(`${ROUTES.settings}/setup?safe=${safe}`)
  }

  /** Set up recovery with `recoverer` and the review window labelled `delay`; the review opens */
  async setUp({ recoverer, delay }: { recoverer: string; delay: string }): Promise<void> {
    await this.setupButton.click()
    await this.nextButton.click()
    await this.addressInput.fill(recoverer)
    await this.chooseDelayAndConfirm(delay)
  }

  /** Change the review window of the recovery to the one labelled `delay`; the review opens */
  async changeDelay(delay: string): Promise<void> {
    await this.editButton.click()
    await this.nextButton.click()
    await this.chooseDelayAndConfirm(delay)
  }

  /** Start removing the recovery module; the review opens */
  async remove(): Promise<void> {
    await this.removeButton.click()
    await this.nextButton.click()
  }

  /** As the recoverer, propose `newOwner` as the only signer and send the proposal with the connected wallet */
  async proposeRecovery(newOwner: string): Promise<void> {
    await this.startRecoveryButton.click()
    await this.addressInput.fill(newOwner)
    await this.nextButton.click()
    await this.proposeButton.click()
  }

  /** Expand the "Action required" panel, which keeps its cards mounted while closed; Enter avoids toasts on top */
  async openActionRequiredPanel(): Promise<void> {
    if ((await this.actionRequiredToggle.getAttribute('aria-expanded')) !== 'true') {
      await this.actionRequiredToggle.press('Enter')
    }
  }

  /** Leave the recovery modal for the queue; the modal closes only once the navigation is done */
  async goToQueue(): Promise<void> {
    await this.goToQueueButton.click()
    await this.goToQueueButton.waitFor({ state: 'hidden' })
  }

  /** Open the queued recovery and start its cancellation; the review opens */
  async cancel(): Promise<void> {
    await this.queuedRecoveries.click()
    await this.cancelButton.click()
    await this.confirmCancelButton.click()
  }

  /** Execute the queued recovery with the connected wallet */
  async execute(): Promise<void> {
    await this.executeButton.click()
    await this.confirmExecuteButton.click()
  }

  private async chooseDelayAndConfirm(delay: string): Promise<void> {
    await this.delaySelect.click()
    await this.page.getByRole('option', { name: delay, exact: true }).click()
    await this.termsCheckbox.click()
    await this.nextButton.click()
  }
}
