/**
 * Wallet Page Object — connecting a private-key, Ledger or WalletConnect wallet and SiWE login.
 *
 * Drives the app's always-registered web3-onboard "Private key" module (backed
 * by an ethers Wallet, no mocks), the Ledger module (on the isolated stack it
 * talks to the Speculos emulator), the WalletConnect module and the Spaces
 * Sign-In With Ethereum flow.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the
 * test file, never here. Waiting (waitFor / waitForResponse) is allowed.
 */
import { type Page, type Locator } from '@playwright/test'
import { CHAIN_IDS } from '../data/constants'

export class WalletPage {
  // Locators
  readonly connectWalletBtn: Locator
  /** web3-onboard modal — a custom element with a shadow DOM (Playwright pierces it automatically) */
  readonly onboardModal: Locator
  readonly privateKeyOption: Locator
  readonly ledgerOption: Locator
  /** web3-onboard's hardware account picker — another custom element with a shadow DOM */
  readonly ledgerAccountSelect: Locator
  readonly walletConnectOption: Locator
  /** The WalletConnect modal's QR code; its `uri` attribute holds the pairing URI */
  readonly walletConnectQrCode: Locator
  readonly privateKeyInput: Locator
  readonly pkConnectBtn: Locator
  readonly accountCenter: Locator
  readonly siweContinueBtn: Locator
  readonly disconnectBtn: Locator

  constructor(private readonly page: Page) {
    // On /welcome/accounts there are several visible connect affordances (a
    // header "Connect Wallet", a top "Connect" button, and a card "Connect
    // wallet"). Keep this an UNfiltered base locator; the action narrows it to a
    // single visible target with `.filter({ visible: true }).first()` so the
    // click never trips Playwright strict mode.
    this.connectWalletBtn = page.getByTestId('connect-wallet-btn')
    this.onboardModal = page.locator('onboard-v2')
    // The web3-onboard modal renders inside the <onboard-v2> custom element's
    // SHADOW DOM as an overlay; the HOST element stays "hidden", so its
    // visibility is the wrong readiness signal. Playwright pierces shadow roots,
    // so we key off the shadow "Private key" button instead.
    this.privateKeyOption = this.onboardModal.getByRole('button', { name: 'Private key' })
    this.ledgerOption = this.onboardModal.getByRole('button', { name: 'Ledger' })
    this.ledgerAccountSelect = page.locator('account-select')
    this.walletConnectOption = this.onboardModal.getByRole('button', { name: 'WalletConnect' })
    this.walletConnectQrCode = page.locator('wcm-qrcode')
    // The testid sits on the <input> itself (shadcn/Base UI), not on a wrapper.
    this.privateKeyInput = page.getByTestId('private-key-input')
    this.pkConnectBtn = page.getByTestId('pk-connect-btn')
    this.accountCenter = page.getByTestId('open-account-center')
    this.siweContinueBtn = page.getByTestId('continue-with-wallet-btn')
    this.disconnectBtn = page.getByRole('button', { name: 'Disconnect' })
  }

  /**
   * Connect a private-key wallet via the web3-onboard "Private key" module.
   * Returns only once the connected-state signal (account center) is visible.
   */
  async connectWallet(privateKey: string): Promise<void> {
    await this.openWalletOption(this.privateKeyOption)

    await this.privateKeyInput.fill(privateKey)
    await this.pkConnectBtn.click()

    await this.accountCenter.waitFor({ state: 'visible' })
  }

  /**
   * Start connecting a wallet over WalletConnect and return the pairing URI that the other wallet needs.
   * The account center appears once the other wallet approves the session.
   */
  async startWalletConnectPairing(): Promise<string> {
    await this.openWalletOption(this.walletConnectOption)
    await this.walletConnectQrCode.waitFor({ state: 'attached' })
    const uri = await this.walletConnectQrCode.getAttribute('uri')
    if (!uri?.startsWith('wc:')) throw new Error(`The WalletConnect modal shows no pairing URI: ${uri}`)
    return uri
  }

  /**
   * Connect the Ledger on Sepolia with its first Ledger Live account, `address`.
   * Deriving addresses needs no confirmation on the device.
   */
  async connectLedger(address: string): Promise<void> {
    await this.openWalletOption(this.ledgerOption)

    // The picker opens on the first configured chain, which is not Sepolia once the stack runs other forks
    const sepolia = `0x${Number(CHAIN_IDS.sepolia).toString(16)}`
    await this.ledgerAccountSelect.locator('select.network-select').selectOption(sepolia)
    await this.ledgerAccountSelect.getByRole('button', { name: 'Scan Accounts' }).click()
    await this.ledgerAccountSelect.getByRole('row').filter({ hasText: address }).click()
    await this.ledgerAccountSelect.getByRole('button', { name: 'Connect' }).click()

    await this.accountCenter.waitFor({ state: 'visible' })
  }

  /**
   * Opens the onboard modal and picks `option`. The click on the connect button
   * can be swallowed (hydration / transient state), so it is retried, keyed off
   * the shadow option button (not the host), until the modal is open.
   */
  private async openWalletOption(option: Locator): Promise<void> {
    for (let attempt = 0; attempt < 6; attempt++) {
      if (await option.isVisible()) break
      await this.connectWalletBtn
        .filter({ visible: true })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {})
      await option.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
    }

    // Surfaces a clear failure if the modal never opened.
    await option.click()
  }

  /**
   * Dismiss the cookie consent banner if it is on screen. No-op when the banner
   * is already suppressed (the seeded consent normally handles this), so it is
   * safe to call unconditionally after the first navigation.
   */
  async acceptCookies(): Promise<void> {
    const acceptAll = this.page.getByRole('button', { name: 'Accept all' })
    if (await acceptAll.isVisible().catch(() => false)) {
      await acceptAll.click().catch(() => {})
    }
  }

  /**
   * Perform SiWE (Sign-In With Ethereum) login.
   *
   * Requires the SiWE UI (Spaces sign-in) to be on screen and a wallet already
   * connected. Signing happens programmatically via the PK module (no popup);
   * the session cookie is set by the `/v1/auth/verify` response.
   */
  async signInWithEthereum(): Promise<void> {
    const verify = this.page.waitForResponse(
      (r) => /\/v1\/auth\/verify/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
    )
    await this.siweContinueBtn.click()
    await verify
  }

  /** Disconnect the connected wallet from the account center; returns once the connect button is back */
  async disconnect(): Promise<void> {
    await this.accountCenter.click()
    await this.disconnectBtn.click()
    await this.connectWalletBtn.filter({ visible: true }).first().waitFor({ state: 'visible' })
  }
}
