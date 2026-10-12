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
import { seedLocalAddressBook } from '../../src/fixtures/seed-address-book'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { SAFES } from '../../src/data/constants'

// Digit-only (checksum-neutral) local contacts so the dropdown has options.
const LOCAL_CONTACTS = [
  { address: '0x1111111111111111111111111111111111111111', name: 'E2E Caret One' },
  { address: '0x2222222222222222222222222222222222222222', name: 'E2E Caret Two' },
]

test.describe('Recipient dropdown — caret toggle', { tag: '@regression' }, () => {
  test('should open the dropdown on caret click and close it on a second click', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // Seed local contacts so there are visible options (the caret only shows then).
    await seedLocalAddressBook(safePage, LOCAL_CONTACTS)

    const home = new HomePage(safePage)
    const sendTokens = new SendTokensPage(safePage)

    // Open the Safe and connect the owner wallet (enables "New transaction").
    await home.goto(SAFES.SEP_OWNER_4_SAFE)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // Open the Send-tokens flow.
    await expect(sendTokens.newTxButton).toBeEnabled()
    await sendTokens.open()

    const recipient = sendTokens.recipientInput
    const caret = sendTokens.recipientCaret
    await expect(recipient).toBeVisible()
    await expect(caret).toBeVisible()

    // Dropdown starts closed.
    await expect(recipient).toHaveAttribute('aria-expanded', 'false')

    // First caret click opens it.
    await caret.click()
    await expect(recipient).toHaveAttribute('aria-expanded', 'true')
    await expect(sendTokens.suggestion('E2E Caret One')).toBeVisible()

    // Second caret click closes it.
    await caret.click()
    await expect(recipient).toHaveAttribute('aria-expanded', 'false')
  })
})
