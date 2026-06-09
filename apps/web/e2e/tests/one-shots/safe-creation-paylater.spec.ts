/**
 * One-shot clickthrough — Safe creation, "Pay later" (counterfactual).
 *
 * A wallet-connected DEMO walkthrough of the new Safe creation wizard ending in
 * "Pay later", which produces a counterfactual Safe: NO on-chain transaction and
 * NO funds required. It exercises wallet connect (web3-onboard "Private key"
 * module, no mocks) and SiWE (Sign-In With Ethereum) — selecting "Pay later" on
 * the Review step triggers SiWE, which the PK module signs programmatically
 * (no wallet popup), so the `/v1/auth/verify` response resolves on its own.
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
  test('should create a counterfactual Safe via the pay-later flow', async ({ safePage, walletPage, credentials }) => {
    // 1. Entry on Sepolia + connect the signer wallet.
    await safePage.goto('/welcome/accounts?chain=sep')
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // 2. Start the creation wizard.
    await safePage.getByTestId('create-safe-btn').click()
    await expect(safePage).toHaveURL(/\/new-safe\/create/)

    // 3. Set-name step. Network auto-selects Sepolia from the connected wallet.
    await safePage.locator('input[name="name"]').fill('One-shot CF Safe')
    await safePage.getByTestId('next-btn').click()

    // 4. Owners step — connected signer as sole owner, threshold 1 (defaults).
    await safePage.getByTestId('next-btn').click()

    // 5. Review step.
    await expect(safePage.getByTestId('safe-setup-overview')).toBeVisible()
    await expect(safePage.getByTestId('pay-now-later-message-box')).toBeVisible()

    // 6. Select "Pay later" (counter-intuitively `connected-wallet-execution-method`).
    //    Selecting it while unauthenticated triggers SiWE; the PK module auto-signs.
    //    Arm the verify wait BEFORE clicking to avoid a race.
    const siweVerify = safePage.waitForResponse((r) => /\/v1\/auth\/verify/.test(r.url()))
    await safePage.getByTestId('connected-wallet-execution-method').click()
    await siweVerify

    // 7. Create the counterfactual Safe.
    await safePage.getByTestId('review-step-next-btn').click()

    // 8. Success dialog.
    await expect(safePage.getByTestId('account-success-message')).toBeVisible()
    await safePage.getByTestId('cf-creation-lets-go-btn').click()

    // 9. Lands on the dashboard with the not-activated banner.
    await expect(safePage).toHaveURL(/\/home\?safe=sep:/)
    await expect(safePage.getByTestId('activation-section')).toBeVisible()
  })
})
