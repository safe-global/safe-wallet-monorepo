/**
 * Regression — the caret on the recipient input toggles the dropdown.
 *
 * Clicking the caret opens the address-book dropdown; clicking it again closes
 * it. The caret only renders when there are visible options, so a couple of local
 * contacts are seeded via localStorage (no workspace/auth needed). The wallet
 * (OWNER_4, owner of the Safe) is connected so "New transaction" is enabled.
 *
 * Open/closed state is read from the combobox's `aria-expanded`.
 *
 * Run: yarn workspace @safe-global/web pw:test recipient-dropdown-caret-toggle
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, CHAIN_IDS, LS_NAMESPACE } from '../../src/data/constants'

// Digit-only (checksum-neutral) local contacts so the dropdown has options.
const LOCAL_CONTACTS = {
  '0x1111111111111111111111111111111111111111': 'E2E Caret One',
  '0x2222222222222222222222222222222222222222': 'E2E Caret Two',
}

test.describe('Recipient dropdown — caret toggle', { tag: '@regression' }, () => {
  test('should open the dropdown on caret click and close it on a second click', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // Seed local contacts so there are visible options (the caret only shows then).
    await safePage.addInitScript(
      ({ ns, chainId, book }) => {
        window.localStorage.setItem(`${ns}addressBook`, JSON.stringify({ [chainId]: book }))
      },
      { ns: LS_NAMESPACE, chainId: CHAIN_IDS.sepolia, book: LOCAL_CONTACTS },
    )

    // Open the Safe and connect the owner wallet (enables "New transaction").
    await safePage.goto(`/home?safe=${SAFES.SEP_OWNER_4_SAFE}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // Open the Send-tokens flow.
    await expect(safePage.getByTestId('new-tx-btn')).toBeEnabled()
    await safePage.getByTestId('new-tx-btn').click()
    await safePage.getByTestId('send-tokens-btn').click()

    const recipient = safePage.getByRole('combobox', { name: /Recipient address/ })
    const caret = safePage.getByTestId('address-book-toggle')
    await expect(recipient).toBeVisible()
    await expect(caret).toBeVisible()

    // Dropdown starts closed.
    await expect(recipient).toHaveAttribute('aria-expanded', 'false')

    // First caret click opens it.
    await caret.click()
    await expect(recipient).toHaveAttribute('aria-expanded', 'true')
    await expect(safePage.getByTestId('address-item').filter({ hasText: 'E2E Caret One' })).toBeVisible()

    // Second caret click closes it.
    await caret.click()
    await expect(recipient).toHaveAttribute('aria-expanded', 'false')
  })
})
