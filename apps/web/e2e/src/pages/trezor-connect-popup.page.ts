import { type Page, type Locator } from '@playwright/test'

/**
 * Trezor Connect's popup on connect.trezor.io. Before a call reaches the device, the popup asks for analytics consent
 * (once per browser context), for the device, for permissions, and to export a bundle of addresses. Then it closes,
 * or it waits for the user on the device.
 */
export class TrezorConnectPopup {
  readonly analyticsConfirm: Locator
  readonly deviceButton: Locator
  readonly allowOnce: Locator
  /** Asked before the popup reads a bundle of addresses, as the account picker's scan does */
  readonly exportAddresses: Locator
  readonly deviceInstructions: Locator

  constructor(
    private readonly popup: Page,
    deviceLabel: string,
  ) {
    this.analyticsConfirm = popup.getByRole('button', { name: 'Confirm', exact: true })
    this.deviceButton = popup.getByRole('button', { name: deviceLabel })
    this.allowOnce = popup.getByRole('button', { name: 'Allow once for this session' })
    this.exportAddresses = popup.getByRole('button', { name: 'Export', exact: true })
    // The popup keeps a hidden copy of each view
    this.deviceInstructions = popup.getByText('Follow instructions on your device').filter({ visible: true })
  }

  /** Answers the popup's questions until it closes or hands over to the device. */
  async answer(): Promise<void> {
    const questions = [this.analyticsConfirm, this.deviceButton, this.allowOnce, this.exportAddresses]
    const nextStep = questions
      .reduce((step, question) => step.or(question), this.deviceInstructions)
      .filter({ visible: true })
      .first()
    while (!this.popup.isClosed()) {
      try {
        await nextStep.waitFor()
        if (await this.deviceInstructions.isVisible()) return
        for (const question of questions) {
          if (await question.isVisible()) {
            await question.click()
            break
          }
        }
      } catch (error) {
        // The popup closes on its own once a call that needs no device approval returns.
        if (!this.popup.isClosed()) throw error
      }
    }
  }
}
