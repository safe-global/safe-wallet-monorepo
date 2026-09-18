/**
 * Regression — the send-tokens form can be completed with the keyboard alone (WA-3550).
 *
 * Picking a contact turns the recipient input `visibility: hidden`; Chromium then drops focus and
 * restarts Tab from the top of the document, so keyboard users had to tab through the whole header
 * to reach Amount. Only a real browser implements that focus fixup, hence Playwright.
 *
 * Data: the static OWNER_4 Safe (read-only) plus two local contacts — parallel-safe, no cleanup.
 *
 * Run: yarn workspace @safe-global/web pw:test send-form-keyboard-navigation
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { seedLocalAddressBook } from '../../src/fixtures/seed-address-book'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { SAFES, DROPDOWN_LOCAL_CONTACTS } from '../../src/data/constants'

const [FIRST_CONTACT, SECOND_CONTACT] = DROPDOWN_LOCAL_CONTACTS

test.describe('Send tokens — keyboard navigation', { tag: '@regression' }, () => {
  test('should tab from the picked contact through amount, Max and token to Next when the recipient is chosen with the keyboard', async ({
    safePage,
    walletPage,
    credentials,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'safe-address', description: SAFES.SEP_OWNER_4_SAFE })

    await seedLocalAddressBook(safePage, [FIRST_CONTACT, SECOND_CONTACT])

    const home = new HomePage(safePage)
    const sendTokens = new SendTokensPage(safePage)

    await home.goto(SAFES.SEP_OWNER_4_SAFE)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    await expect(sendTokens.newTxButton).toBeEnabled()
    await sendTokens.open()

    // --- Pick a contact with the keyboard only -----------------------------
    await sendTokens.recipientInput.click()
    await sendTokens.recipientInput.pressSequentially('E2E')
    await expect(sendTokens.suggestionList).toBeVisible()

    await safePage.keyboard.press('ArrowDown')
    // Asserted, not assumed: a failure here names the dropdown order rather than looking like the
    // focus bug returning two assertions later.
    await expect(sendTokens.suggestion(FIRST_CONTACT.name)).toHaveAttribute('aria-selected', 'true')
    await safePage.keyboard.press('Enter')

    // The chip holding focus IS the fix.
    await expect(sendTokens.recipientChipValue).toContainText(new RegExp(FIRST_CONTACT.address, 'i'))
    await expect(sendTokens.recipientChip).toBeFocused()

    // --- Tab forward through the form --------------------------------------
    // Max renders only once balances load; without this the first Tab can race it.
    await expect(sendTokens.maxButton).toBeVisible()

    await safePage.keyboard.press('Tab')
    await expect(sendTokens.amountField).toBeFocused()
    // Under the Safe's ETH balance, so the form validates and Next becomes enabled.
    await safePage.keyboard.type('0.000001')

    await safePage.keyboard.press('Tab')
    await expect(sendTokens.maxButton).toBeFocused()

    await safePage.keyboard.press('Tab')
    await expect(sendTokens.tokenSelector).toBeFocused()

    await safePage.keyboard.press('Tab')
    await expect(sendTokens.addRecipientButton).toBeFocused()

    // A disabled button is not a tab stop, so the form must be valid before Tab reaches Next.
    await expect(sendTokens.nextButton).toBeEnabled()
    await safePage.keyboard.press('Tab')
    await expect(sendTokens.nextButton).toBeFocused()

    // --- Shift+Tab back to the chip ----------------------------------------
    // Five stops back: Next → Add recipient → token → Max → amount.
    for (let i = 0; i < 5; i++) {
      await safePage.keyboard.press('Shift+Tab')
    }
    await expect(sendTokens.recipientChip).toBeFocused()

    // --- Enter reopens the recipient for editing ---------------------------
    await safePage.keyboard.press('Enter')
    await expect(sendTokens.recipientInput).toBeFocused()
    await expect(sendTokens.recipientInput).toHaveValue(new RegExp(FIRST_CONTACT.address, 'i'))
    await expect(sendTokens.recipientInput).toHaveAttribute('aria-expanded', 'true')
    await expect(sendTokens.suggestion(SECOND_CONTACT.name)).toBeVisible()
  })
})
