import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, AB_LOCAL_CONTACT, CHAIN_IDS, LS_NAMESPACE } from '../../src/data/constants'

test.describe('Recipient dropdown — address book selection', { tag: '@one-shot' }, () => {
  test('should fill the recipient field with the contact address when a dropdown entry is selected', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // 1. Seed a single local address-book contact for the Safe's chain so the
    //    dropdown has a deterministic entry to select.
    await safePage.addInitScript(
      ({ key, chainId, address, name }) => {
        window.localStorage.setItem(key, JSON.stringify({ [chainId]: { [address]: name } }))
      },
      {
        key: `${LS_NAMESPACE}addressBook`,
        chainId: CHAIN_IDS.sepolia,
        address: AB_LOCAL_CONTACT.address,
        name: AB_LOCAL_CONTACT.name,
      },
    )

    // 2. Open the Safe and connect the owner wallet (enables "New transaction").
    await safePage.goto(`/home?safe=${SAFES.SEP_OWNER_4_SAFE}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // 3. Open the Send-tokens flow.
    await safePage.getByTestId('new-tx-btn').click()
    await safePage.getByTestId('send-tokens-btn').click()

    // 4. Open the recipient address-book dropdown.
    const recipientInput = safePage.getByLabel(/Recipient address/)
    await expect(recipientInput).toBeVisible()
    await recipientInput.click()

    // 5. The seeded contact appears in the dropdown — select it.
    const option = safePage.getByText(AB_LOCAL_CONTACT.name)
    await expect(option).toBeVisible()
    await option.click()

    // 6. The selected contact's address is now shown in the recipient field.
    const selectedRecipient = safePage.getByTestId('address-book-recipient')
    await expect(selectedRecipient).toBeVisible()
    await expect(selectedRecipient).toContainText(AB_LOCAL_CONTACT.address)
    await expect(selectedRecipient).toContainText(AB_LOCAL_CONTACT.name)
  })
})
