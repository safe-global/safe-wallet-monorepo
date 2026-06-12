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
    await this.submitPkConnectForm(privateKey)

    await this.accountCenter.waitFor({ state: 'visible' })
  }

  /**
   * Sign in to Spaces from a Spaces sign-in screen (e.g. /welcome/spaces).
   *
   * Spaces login screens render no account center, so `connectWallet` cannot be
   * used there. Connecting through the "Connect wallet" SignInButton chains
   * straight into SiWE (the PK module signs programmatically, no popup), so the
   * `/v1/auth/verify` response is the connected-and-authenticated signal.
   *
   * Returns the CGW origin extracted from the verify call — useful for
   * follow-up API calls that must reuse the session cookie.
   */
  async signInToSpaces(privateKey: string): Promise<string> {
    const verify = this.page.waitForResponse(
      (r) => /\/v1\/auth\/verify/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
    )
    await this.submitPkConnectForm(privateKey)
    return new URL((await verify).url()).origin
  }

  /** Open the onboard modal and submit the "Private key" connect form. */
  private async submitPkConnectForm(privateKey: string): Promise<void> {
    // Clicking the connect button opens the onboard modal, but the click can be
    // swallowed (hydration / transient state). Retry a few times, keyed off the
    // shadow "Private key" button (not the host), until the modal is open.
    for (let attempt = 0; attempt < 6; attempt++) {
      if (await this.privateKeyOption.isVisible()) break
      await this.connectWalletBtn
        .filter({ visible: true })
        .first()
        .click({ timeout: 5000 })
        .catch(() => {})
      await this.privateKeyOption.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
    }

    // Surfaces a clear failure if the modal never opened.
    await this.privateKeyOption.click()

    await this.privateKeyInput.fill(privateKey)
    await this.pkConnectBtn.click()
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
}
