/**
 * One-shot clickthrough — grouped recipient dropdown in the send-funds flow.
 *
 * A wallet-connected DEMO walkthrough of the reworked AddressBookInput
 * dropdown: contacts are grouped by source ("Local contacts" / workspace
 * contacts) with a header and per-contact provenance, and the selected
 * recipient keeps the bold first/last-4-digit address highlighting.
 *
 * Scope note: the flow stops after the recipient is selected — no amount is
 * entered and nothing is signed or proposed, so the test is read-only and
 * parallel-safe. The local contact is seeded into localStorage before the app
 * loads; the static Safe + OWNER_4 signer mirror the Cypress smoke
 * create_tx.cy.js setup, which proves the wallet can open the send flow.
 *
 * Tag: @one-shot — runs only under the "one-shots" Playwright project.
 * Requires CYPRESS_WALLET_CREDENTIALS (same secret Cypress uses); CI passes
 * it automatically.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, TEST_ADDRESSES, CHAIN_IDS, LS_NAMESPACE } from '../../src/data/constants'

const CONTACT_NAME = 'One-shot local contact'

test.describe('Send funds — grouped recipient dropdown', { tag: '@one-shot' }, () => {
  test('should group local contacts in the recipient dropdown and select one when clicked', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // 1. Seed a local address book contact on Sepolia before the app loads.
    await safePage.addInitScript(
      ({ key, chainId, address, name }) => {
        window.localStorage.setItem(key, JSON.stringify({ [chainId]: { [address]: name } }))
      },
      {
        key: `${LS_NAMESPACE}addressBook`,
        chainId: CHAIN_IDS.sepolia,
        address: TEST_ADDRESSES.NON_OWNER,
        name: CONTACT_NAME,
      },
    )

    // 2. Open the static Safe and connect the owner wallet.
    await safePage.goto(`/home?safe=${SAFES.SEP_STATIC_SAFE_2}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // 3. Start the send-tokens flow.
    await safePage.getByRole('button', { name: 'New transaction' }).click()
    await safePage.getByTestId('send-tokens-btn').click()

    // 4. Open the recipient dropdown — clicking the input opens the autocomplete.
    const recipientInput = safePage.getByLabel(/Recipient address/)
    await recipientInput.click()

    // 5. The seeded contact renders under the "Local contacts" group header
    //    with its provenance line.
    const groupHeader = safePage.getByTestId('contact-group-header')
    await expect(groupHeader).toBeVisible()
    await expect(groupHeader).toContainText('Local contacts')
    await expect(safePage.getByText(CONTACT_NAME)).toBeVisible()
    await expect(safePage.getByText('Saved on this device')).toBeVisible()

    // 6. Select the contact — the read-only input shows the contact's name and
    //    full address (split across bold segments, so assert on text content).
    await safePage.getByText(CONTACT_NAME).click()
    const selectedRecipient = safePage.getByTestId('address-book-recipient')
    await expect(selectedRecipient).toBeVisible()
    await expect(selectedRecipient).toContainText(TEST_ADDRESSES.NON_OWNER)
  })
})
