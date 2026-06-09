/**
 * Wallet Page Object — connecting a private-key wallet and SiWE login.
 *
 * Drives the app's always-registered web3-onboard "Private key" module (backed
 * by an ethers Wallet, no mocks) and the Spaces Sign-In With Ethereum flow.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the
 * test file, never here. Waiting (waitFor / waitForResponse) is allowed.
 */
import { type Page, type Locator } from '@playwright/test'

export class WalletPage {
  // Locators
  readonly connectWalletBtn: Locator
  /** web3-onboard modal — a custom element with a shadow DOM (Playwright pierces it automatically) */
  readonly onboardModal: Locator
  readonly privateKeyOption: Locator
  readonly privateKeyInput: Locator
  readonly pkConnectBtn: Locator
  readonly accountCenter: Locator
  readonly siweContinueBtn: Locator

  constructor(private readonly page: Page) {
    this.connectWalletBtn = page.getByTestId('connect-wallet-btn')
    this.onboardModal = page.locator('onboard-v2')
    this.privateKeyOption = this.onboardModal.getByRole('button', { name: 'Private key' })
    this.privateKeyInput = page.getByTestId('private-key-input').locator('input')
    this.pkConnectBtn = page.getByTestId('pk-connect-btn')
    this.accountCenter = page.getByTestId('open-account-center')
    this.siweContinueBtn = page.getByTestId('continue-with-wallet-btn')
  }

  /**
   * Connect a private-key wallet via the web3-onboard "Private key" module.
   * Returns only once the connected-state signal (account center) is visible.
   */
  async connectWallet(privateKey: string): Promise<void> {
    // The connect button may be the home one or the welcome one — clicking opens onboard.
    if (await this.connectWalletBtn.isVisible()) {
      await this.connectWalletBtn.click()
    }

    await this.onboardModal.waitFor({ state: 'visible' })
    await this.privateKeyOption.click()

    await this.privateKeyInput.fill(privateKey)
    await this.pkConnectBtn.click()

    await this.accountCenter.waitFor({ state: 'visible' })
  }

  /**
   * Perform SiWE (Sign-In With Ethereum) login.
   *
   * Requires the SiWE UI (Spaces sign-in) to be on screen and a wallet already
   * connected. Signing happens programmatically via the PK module (no popup);
   * the session cookie is set by the `/v1/auth/verify` response.
   */
  async signInWithEthereum(): Promise<void> {
    const verify = this.page.waitForResponse((r) => /\/v1\/auth\/verify/.test(r.url()))
    await this.siweContinueBtn.click()
    await verify
  }
}
