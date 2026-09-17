/**
 * Regression — the send-tokens form can be completed with the keyboard alone (WA-3550).
 *
 * Purpose: after picking an address-book contact with ArrowDown + Enter, Tab must continue
 * through the visible form controls (amount → Max → token → Next) instead of jumping to the
 * browser chrome and the page header.
 *
 * Risk: the recipient input turns `visibility: hidden` once the address is a saved contact.
 * Chromium drops focus from a hidden element and restarts Tab from the top of the document, so
 * keyboard users had to tab through the whole header and sidebar to reach Amount. Firefox keeps
 * the tab position, which is why only Chrome users reported it.
 *
 * Why Playwright: jsdom does not implement the browser's focus fixup for hidden elements — the
 * bug only exists in a real browser's sequential focus navigation.
 *
 * Data: the static OWNER_4 Safe (read-only, ETH balance) plus two local contacts seeded via
 * localStorage; nothing is created or mutated, so the test is parallel-safe.
 *
 * Run: yarn workspace @safe-global/web pw:test send-form-keyboard-navigation
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, CHAIN_IDS, LS_NAMESPACE, DROPDOWN_LOCAL_CONTACTS } from '../../src/data/constants'

const [FIRST_CONTACT, SECOND_CONTACT] = DROPDOWN_LOCAL_CONTACTS

test.describe('Send tokens — keyboard navigation', { tag: '@regression' }, () => {
  test('tabs from a picked contact through amount, Max and token to Next', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    await safePage.addInitScript(
      ({ ns, chainId, book }) => {
        window.localStorage.setItem(`${ns}addressBook`, JSON.stringify({ [chainId]: book }))
      },
      {
        ns: LS_NAMESPACE,
        chainId: CHAIN_IDS.sepolia,
        book: { [FIRST_CONTACT.address]: FIRST_CONTACT.name, [SECOND_CONTACT.address]: SECOND_CONTACT.name },
      },
    )

    await safePage.goto(`/home?safe=${SAFES.SEP_OWNER_4_SAFE}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    await expect(safePage.getByTestId('new-tx-btn')).toBeEnabled()
    await safePage.getByTestId('new-tx-btn').click()
    await safePage.getByTestId('send-tokens-btn').click()

    const recipient = safePage.getByRole('combobox', { name: /Recipient address/ })
    await recipient.click()
    await safePage.keyboard.press('ArrowDown')
    await expect(recipient).toHaveAttribute('aria-expanded', 'true')
    await safePage.keyboard.press('Enter')

    // The picked contact renders as a focusable chip so the tab position stays in the form.
    const chip = safePage.getByRole('button', { name: new RegExp(FIRST_CONTACT.name) })
    await expect(chip).toBeFocused()

    await safePage.keyboard.press('Tab')
    const amount = safePage.getByTestId('token-amount-field')
    await expect(amount).toBeFocused()
    await safePage.keyboard.type('0.000001')

    await safePage.keyboard.press('Tab')
    await expect(safePage.getByTestId('max-btn')).toBeFocused()

    await safePage.keyboard.press('Tab')
    await expect(safePage.getByTestId('token-selector').getByRole('combobox')).toBeFocused()

    await safePage.keyboard.press('Tab')
    await expect(safePage.getByTestId('add-recipient-btn')).toBeFocused()

    const next = safePage.getByRole('button', { name: 'Next' })
    await expect(next).toBeEnabled()
    await safePage.keyboard.press('Tab')
    await expect(next).toBeFocused()

    // Shift+Tab back to the chip and Enter reopens the recipient for editing.
    for (let i = 0; i < 5; i++) await safePage.keyboard.press('Shift+Tab')
    await expect(chip).toBeFocused()
    await safePage.keyboard.press('Enter')
    await expect(recipient).toBeFocused()
    await expect(recipient).toHaveValue('')
  })
})
