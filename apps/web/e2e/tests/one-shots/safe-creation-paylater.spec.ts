/**
 * One-shot clickthrough — Safe creation, "Pay later" (counterfactual).
 *
 * A wallet-connected DEMO walkthrough of the new Safe creation wizard up to the
 * "Pay later" choice. It exercises wallet connect (web3-onboard "Private key"
 * module, no mocks) and SiWE (Sign-In With Ethereum) — selecting "Pay later" on
 * the Review step triggers SiWE, which the PK module signs programmatically
 * (no wallet popup), so the `/v1/auth/verify` response resolves on its own.
 *
 * Scope note: the test asserts the flow up to creation being *initiated*, not
 * the final success screen. Counterfactual creation persists to a backend that
 * is not available on ephemeral PR-preview deploys (the create button spins
 * indefinitely there), so asserting completion would be perpetually flaky. The
 * recording still captures the full clickthrough including the create click.
 *
 * Runs against a deployed PR preview on Sepolia. The single continuous
 * clickthrough produces one cohesive video recording on every run (pass or
 * fail) for PR commentary.
 *
 * Tag: @one-shot — runs only under the "one-shots" Playwright project.
 * Requires CYPRESS_WALLET_CREDENTIALS to be set (the same secret Cypress uses);
 * CI passes it automatically.
 */
import { test, expect } from '../../src/fixtures/test.fixture'

test.describe('Safe creation — pay later', { tag: '@one-shot' }, () => {
  test('should walk through the pay-later creation flow and sign in with SiWE', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // 1. Entry on Sepolia + connect the signer wallet.
    await safePage.goto('/welcome/accounts?chain=sep')
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // 2. Start the creation wizard.
    await safePage.getByTestId('create-safe-btn').click()
    await expect(safePage).toHaveURL(/\/new-safe\/create/)

    // 3. Set-name step. Network auto-selects Sepolia from the connected wallet;
    //    wait for Next to enable so we don't advance before the chain resolves.
    await safePage.locator('input[name="name"]').fill('One-shot CF Safe')
    await expect(safePage.getByTestId('next-btn')).toBeEnabled()
    await safePage.getByTestId('next-btn').click()

    // 4. Owners step — connected signer as sole owner, threshold 1 (defaults).
    await expect(safePage.getByTestId('owner-policy-step-form')).toBeVisible()
    await safePage.getByTestId('next-btn').click()

    // 5. Review step.
    await expect(safePage.getByTestId('safe-setup-overview')).toBeVisible()
    await expect(safePage.getByTestId('pay-now-later-message-box')).toBeVisible()

    // 6. Select "Pay later" (counter-intuitively `connected-wallet-execution-method`).
    //    Selecting it while unauthenticated triggers SiWE; the PK module auto-signs.
    //    Arm the verify wait BEFORE clicking to avoid a race.
    const siweVerify = safePage.waitForResponse(
      (r) => /\/v1\/auth\/verify/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
    )
    await safePage.getByTestId('connected-wallet-execution-method').click()
    // SiWE verify succeeded (2xx) — the wallet is now authenticated and
    // "Pay later" is enabled. This is the key auth checkpoint.
    await siweVerify

    // 7. Initiate creation. We assert it was *initiated* (the button enters the
    //    creating state) rather than the success screen — counterfactual
    //    creation completes only against a full backend, which the ephemeral PR
    //    preview lacks (see the scope note in the file header). The recording
    //    still captures the create click.
    const createBtn = safePage.getByTestId('review-step-next-btn')
    await createBtn.click()
    await expect(createBtn).toBeDisabled()
  })
})
