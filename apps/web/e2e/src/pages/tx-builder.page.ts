/**
 * Transaction Builder Page Object — the Safe App from apps/tx-builder, which the isolated stack serves on port 4000,
 * opened in its iframe in the wallet.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type FrameLocator, type Locator, type Page } from '@playwright/test'
import { LS_NAMESPACE } from '../data/constants'

// The URL that the local config service lists for Transaction Builder
export const TX_BUILDER_URL = 'http://localhost:4000'

const ADDRESS_BOOK_GRANT = {
  [TX_BUILDER_URL]: [{ invoker: TX_BUILDER_URL, parentCapability: 'requestAddressBook', date: 1, caveats: [] }],
}

export class TxBuilderPage {
  readonly app: FrameLocator
  /** The wallet's prompt for the permissions that the app asks for through the Safe Apps SDK */
  readonly permissionsPrompt: Locator

  constructor(private readonly page: Page) {
    this.app = page.frameLocator(`iframe[id="iframe-${encodeURIComponent(TX_BUILDER_URL)}"]`)
    this.permissionsPrompt = page.getByRole('dialog').filter({ hasText: 'Permissions Request' })
  }

  /** Open Transaction Builder for the Safe (`sep:0x…`), with the Safe Apps disclaimer and permissions accepted */
  async open(safe: string): Promise<void> {
    await this.openWithSafePermissions(safe, ADDRESS_BOOK_GRANT)
  }

  /** Open Transaction Builder with the disclaimer accepted, but no permission given to the app yet */
  async openWithoutPermissions(safe: string): Promise<void> {
    await this.openWithSafePermissions(safe, {})
  }

  /** Click the empty address field, which makes the app ask the wallet for the address book */
  async clickAddressField(): Promise<void> {
    await this.app.getByLabel(/enter address or ens name/i).click()
  }

  async acceptPermissionsRequest(): Promise<void> {
    await this.permissionsPrompt.getByRole('button', { name: 'Accept' }).click()
  }

  private async openWithSafePermissions(safe: string, safePermissions: Record<string, unknown[]>): Promise<void> {
    await this.page.addInitScript(
      ({ ns, permissions }) => {
        const infoModal = { 11155111: { consentsAccepted: true, warningCheckedCustomApps: [] } }
        window.localStorage.setItem(`${ns}SafeApps__infoModal`, JSON.stringify(infoModal))
        window.localStorage.setItem(`${ns}SafeApps__safePermissions`, JSON.stringify(permissions))
      },
      { ns: LS_NAMESPACE, permissions: safePermissions },
    )
    await this.page.goto(`/apps/open?safe=${safe}&appUrl=${encodeURIComponent(TX_BUILDER_URL)}`)
  }

  /** Add a call of `method` on `contract` with one address argument, then create and send the batch to the wallet */
  async sendCall({
    contract,
    method,
    argument,
  }: {
    contract: string
    method: string
    argument: string
  }): Promise<void> {
    await this.app.getByLabel(/enter address or ens name/i).fill(contract)
    await this.app.locator('[name="contractMethodIndex"]').locator('..').click()
    await this.app.getByRole('option', { name: method }).click()
    await this.app.getByLabel('newValue (address)').fill(argument)
    await this.app.getByText(/add new transaction/i).click()
    await this.app.getByText(/create batch/i).click()
    await this.app.getByText(/send batch/i).click()
  }
}
