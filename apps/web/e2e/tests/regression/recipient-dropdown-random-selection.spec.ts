/**
 * Regression — recipient dropdown reliably populates the field for any contact,
 * across both the workspace and local groups.
 *
 * The improved recipient dropdown groups contacts into "Contacts of <workspace>"
 * (server/space) and "Local contacts" (this browser). This test proves the core
 * wiring property: selecting ANY entry, from EITHER group, always sets the
 * recipient field to that entry's address — repeated across every entry so a
 * stale / wrong-value regression on re-selection is caught.
 *
 * Deterministic setup (ports Cypress `spaces_address_book_import.cy.js`'s
 * `setupSpacesAuth`): a SiWE session is faked via localStorage + a mocked
 * `/v1/auth/me` (without that mock the session-expiry guard's probe 403s against
 * staging and clears the session — which is exactly why a plain seed fails). The
 * spaces endpoints are mocked to inject a workspace and its contacts; local
 * contacts are seeded via localStorage. The wallet (OWNER_4, owner of the Safe)
 * is connected so "New transaction" is enabled. No real sign-in, no real
 * workspace required.
 *
 * The per-contact assertion is data-driven: it reads each rendered option's
 * address from the dropdown and verifies the field matches after selection.
 *
 * Run: yarn workspace @safe-global/web pw:test recipient-dropdown-random-selection
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import type { Page } from '@playwright/test'
import {
  SAFES,
  CHAIN_IDS,
  LS_NAMESPACE,
  DROPDOWN_TEST_SPACE,
  DROPDOWN_LOCAL_CONTACTS,
  DROPDOWN_WORKSPACE_CONTACTS,
} from '../../src/data/constants'

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/

const SIGNER = '0x1234567890123456789012345678901234567890'

const SPACE = {
  id: Number(DROPDOWN_TEST_SPACE.id),
  uuid: DROPDOWN_TEST_SPACE.id,
  name: DROPDOWN_TEST_SPACE.name,
  status: 'ACTIVE',
  safeCount: 1,
  members: [{ id: 1, role: 'ADMIN', name: 'Admin', status: 'ACTIVE', user: { id: 1, status: 'ACTIVE' } }],
}

const WORKSPACE_ADDRESS_BOOK = {
  spaceId: DROPDOWN_TEST_SPACE.id,
  spaceUuid: DROPDOWN_TEST_SPACE.id,
  data: DROPDOWN_WORKSPACE_CONTACTS.map((c) => ({
    name: c.name,
    address: c.address,
    chainIds: [CHAIN_IDS.sepolia],
    createdBy: '',
    createdByUserId: 0,
    lastUpdatedBy: '',
    lastUpdatedByUserId: 0,
    createdAt: '',
    updatedAt: '',
  })),
}

/**
 * Fakes an authenticated Spaces session and injects a deterministic workspace +
 * contacts by mocking the auth/users/spaces GET endpoints. Everything else
 * (chains, safe info) hits the real CGW. Mirrors Cypress `setupSpacesAuth`.
 */
async function mockSpacesSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ ns, spaceId, chainId, localContacts }) => {
      window.localStorage.setItem(
        `${ns}auth`,
        JSON.stringify({
          sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
          lastUsedSpace: spaceId,
          isStoreHydrated: false,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        }),
      )
      const book = Object.fromEntries(localContacts.map((c) => [c.address, c.name]))
      window.localStorage.setItem(`${ns}addressBook`, JSON.stringify({ [chainId]: book }))
    },
    {
      ns: LS_NAMESPACE,
      spaceId: DROPDOWN_TEST_SPACE.id,
      chainId: CHAIN_IDS.sepolia,
      localContacts: DROPDOWN_LOCAL_CONTACTS.map((c) => ({ name: c.name, address: c.address })),
    },
  )

  // Keeps the session-expiry guard's probe from 403-ing and clearing the session.
  await page.route(/\/v1\/auth\/me(\?.*)?$/, (route) =>
    route.fulfill({ json: { id: '1', authMethod: 'siwe', signerAddress: SIGNER } }),
  )
  await page.route(/\/v1\/users(\?.*)?$/, (route) =>
    route.fulfill({ json: { id: 1, status: 1, wallets: [{ id: 1, address: SIGNER }] } }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/address-book(\?.*)?$/, (route) =>
    route.fulfill({ json: WORKSPACE_ADDRESS_BOOK }),
  )
  await page.route(/\/v1\/spaces\/[^/]+\/members(\?.*)?$/, (route) => route.fulfill({ json: SPACE.members }))
  await page.route(/\/v1\/spaces\/[^/]+\/safes(\?.*)?$/, (route) => route.fulfill({ json: { safes: {} } }))
  await page.route(/\/v1\/spaces\/[^/]+(\?.*)?$/, (route) => route.fulfill({ json: SPACE }))
  await page.route(/\/v1\/spaces(\?.*)?$/, (route) => route.fulfill({ json: [SPACE] }))
}

test.describe('Recipient dropdown — selection updates the field', { tag: '@regression' }, () => {
  test('should set the recipient field to the chosen address for every workspace and local contact', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    await mockSpacesSession(safePage)

    // Open the Safe and connect the owner wallet (enables "New transaction").
    await safePage.goto(`/home?safe=${SAFES.SEP_OWNER_4_SAFE}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // Open the Send-tokens flow.
    await expect(safePage.getByTestId('new-tx-btn')).toBeEnabled()
    await safePage.getByTestId('new-tx-btn').click()
    await safePage.getByTestId('send-tokens-btn').click()

    // The editable input is a combobox; once a contact is selected the field
    // switches to a read-only chip (the input becomes visibility:hidden, so the
    // combobox role disappears) — hence two separate locators.
    const combo = safePage.getByRole('combobox', { name: /Recipient address/ })
    const selectedChip = safePage.getByTestId('address-book-recipient')

    await expect(combo).toBeVisible()
    await combo.click()

    // Mixed setup must be present: both the workspace and local groups render.
    await expect(safePage.getByTestId('contact-group-header').filter({ hasText: 'Contacts of' })).toBeVisible()
    await expect(safePage.getByTestId('contact-group-header').filter({ hasText: 'Local contacts' })).toBeVisible()

    // Read each rendered option's address (data-driven; the input row has no
    // address and is filtered out). renderOption and renderInput share the
    // "address-item" testid, so we key off the presence of a 40-hex address.
    const addresses = await safePage.getByTestId('address-item').evaluateAll((els, re) => {
      const pattern = new RegExp(re)
      return els.map((el) => (el.textContent || '').match(pattern)?.[0]).filter((a): a is string => Boolean(a))
    }, ADDRESS_RE.source)

    expect(addresses.length).toBe(DROPDOWN_LOCAL_CONTACTS.length + DROPDOWN_WORKSPACE_CONTACTS.length)

    // Close the dropdown so each iteration starts from the same closed state.
    await combo.press('Escape')

    // Select each contact in turn; the field must always reflect the choice.
    for (const address of addresses) {
      // If a contact is already selected, click its read-only chip to reset back
      // to the editable (visible) combobox — clicking the chip triggers the
      // field's resetName, which clears the value and re-shows the input.
      if (await selectedChip.isVisible().catch(() => false)) {
        await selectedChip.click()
      }
      await combo.click() // field is empty + closed here, so this opens the dropdown

      const option = safePage.getByTestId('address-item').filter({ hasText: address }).first()
      await expect(option).toBeVisible()
      await option.click()

      // The selected address is shown in the read-only chip (the user-visible
      // confirmation). Value may carry a chain prefix and differing case.
      await expect(selectedChip).toContainText(new RegExp(address, 'i'))
    }
  })
})
