/**
 * Create Safe Page Object — the creation flow under /new-safe/create, the pay-later (counterfactual) Safe it
 * makes, and the activation that deploys it.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'

// "Let's go" waits for the Safe to be created or deployed, which took up to 15 s on a local stack
const LETS_GO_TIMEOUT_MS = 45_000

/** Signers besides the connected wallet and the threshold; without them the wallet is the only owner, threshold 1 */
type SignerSetup = { owners?: string[]; threshold?: number }

export class CreateSafePage {
  readonly nextButton: Locator
  readonly addSignerButton: Locator
  readonly thresholdSelector: Locator
  readonly signInToWorkspaceButton: Locator
  readonly reviewNextButton: Locator
  readonly letsGoButton: Locator
  /** "Activate" on the dashboard of a Safe that is not deployed yet */
  readonly activateButton: Locator
  readonly confirmActivationButton: Locator
  readonly relayMethod: Locator
  readonly activationSection: Locator
  readonly removeNetworkIcon: Locator
  readonly networkInput: Locator

  constructor(private readonly page: Page) {
    this.nextButton = page.getByTestId('next-btn')
    this.addSignerButton = page.getByTestId('add-new-signer')
    this.thresholdSelector = page.getByTestId('threshold-selector')
    this.signInToWorkspaceButton = page.getByTestId('sign-in-to-workspace-btn')
    this.reviewNextButton = page.getByTestId('review-step-next-btn')
    this.letsGoButton = page.getByTestId('cf-creation-lets-go-btn')
    this.activateButton = page.getByTestId('activate-account-btn-cf').first()
    this.confirmActivationButton = page.getByTestId('activate-account-flow-btn')
    this.relayMethod = page.getByTestId('relay-execution-method').first()
    this.activationSection = page.getByTestId('activation-section')
    this.removeNetworkIcon = page.getByTestId('CancelIcon')
    this.networkInput = page.getByRole('combobox').first()
  }

  /**
   * Create a pay-later Safe on Sepolia with the defaults: the connected wallet as the only owner, threshold 1.
   * Returns the address of the new Safe from the URL of its dashboard.
   */
  async createPayLaterSafe(): Promise<string> {
    await this.page.goto('/new-safe/create?chain=sep')
    return this.finishPayLaterCreation()
  }

  /** From the name step: set the signers, sign in to a Workspace and create the Safe as pay-later */
  private async finishPayLaterCreation(signers: SignerSetup = {}): Promise<string> {
    await this.nextButton.click()
    await this.setSigners(signers)
    await this.nextButton.click()
    // A pay-later Safe needs a Workspace session
    await this.signInToWorkspaceButton.click()
    await this.signInToWorkspaceButton.waitFor({ state: 'hidden' })
    await this.reviewNextButton.click()
    await this.letsGoButton.click({ timeout: LETS_GO_TIMEOUT_MS })
    await this.page.waitForURL(/[?&]safe=sep:0x[0-9a-fA-F]{40}/)
    return new URL(this.page.url()).searchParams.get('safe')!.split(':')[1]
  }

  /** On the signers step: add each of `owners` after the connected wallet and pick `threshold` */
  private async setSigners({ owners = [], threshold }: SignerSetup): Promise<void> {
    for (const owner of owners) {
      await this.addSignerButton.click()
      await this.page.getByTestId('address-book-input').last().getByRole('combobox').fill(owner)
    }
    if (threshold) {
      await this.thresholdSelector.click()
      await this.page.getByRole('option', { name: String(threshold), exact: true }).click()
    }
  }

  /**
   * Create a pay-later Safe on several networks, e.g. ['Sepolia', 'Ethereum', 'Polygon']. The connected wallet is
   * the first owner. The first network is the one whose dashboard opens. Returns the address of the new Safe.
   */
  async createMultichainPayLaterSafe(networks: string[], signers: SignerSetup = {}): Promise<string> {
    await this.page.goto('/new-safe/create?chain=sep')
    await this.removeNetworkIcon.first().click()
    for (const network of networks) {
      await this.networkInput.click()
      await this.networkInput.fill(network)
      await this.page
        .getByRole('option')
        .filter({ hasText: new RegExp(`^${network}$`) })
        .click()
    }
    await this.page.getByText('Your Safe account preview').click()
    return this.finishPayLaterCreation(signers)
  }

  /**
   * Deploy the pay-later Safe whose dashboard is open with the relay, and wait until the app reports it as deployed.
   * The relay option shows once the owners' relays have loaded; before that, the app deploys with the wallet.
   * `switchWalletTo` names the Safe's network when the wallet is connected to another one.
   */
  async activate({ switchWalletTo }: { switchWalletTo?: string } = {}): Promise<void> {
    await this.activateButton.click()
    if (switchWalletTo) {
      await this.page
        .getByRole('button', { name: /^Switch to/ })
        .filter({ hasText: switchWalletTo })
        .click()
    }
    await this.relayMethod.click()
    await this.confirmActivationButton.click()
    await this.letsGoButton.click({ timeout: LETS_GO_TIMEOUT_MS })
  }
}
