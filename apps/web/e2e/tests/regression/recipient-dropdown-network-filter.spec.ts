/**
 * Regression — the recipient dropdown only suggests contacts configured for the
 * chain the transaction is on.
 *
 * Sending on Sepolia must never surface a contact that only exists on mainnet or
 * polygon, even when those contacts are in the (workspace) address book. Workspace
 * contacts carry explicit `chainIds`; the dropdown filters by the current chain.
 * Local contacts are stored per chain, so only the current chain's are ever loaded.
 *
 * Setup is explicit and inline (no shared mock helper): a faked Spaces session via
 * localStorage + a mocked `/v1/auth/me` (so the session-expiry guard doesn't clear
 * it), plus mocked spaces endpoints that return workspace contacts spread across
 * Sepolia / mainnet / polygon. The wallet (OWNER_4, owner of the Safe) is connected
 * so "New transaction" is enabled.
 *
 * Run: yarn workspace @safe-global/web pw:test recipient-dropdown-network-filter
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, CHAIN_IDS, LS_NAMESPACE, DROPDOWN_TEST_SPACE } from '../../src/data/constants'

const SIGNER = '0x1234567890123456789012345678901234567890'

// Digit-only addresses are checksum-neutral (no a–f), so the selected value
// matches the address-book key regardless of casing.
const LOCAL_SEPOLIA = { name: 'Local Sepolia', address: '0x1111111111111111111111111111111111111111' }
const LOCAL_MAINNET = { name: 'Local Mainnet', address: '0x2222222222222222222222222222222222222222' }

const WORKSPACE_CONTACTS = [
  { name: 'WS Sepolia Only', address: '0x4444444444444444444444444444444444444444', chainIds: [CHAIN_IDS.sepolia] },
  { name: 'WS Multichain', address: '0x5555555555555555555555555555555555555555', chainIds: [CHAIN_IDS.sepolia, CHAIN_IDS.ethereum] }, // prettier-ignore
  { name: 'WS Mainnet Only', address: '0x6666666666666666666666666666666666666666', chainIds: [CHAIN_IDS.ethereum] },
  { name: 'WS Polygon Only', address: '0x9999999999999999999999999999999999999999', chainIds: [CHAIN_IDS.polygon] },
]

// Contacts that should appear when sending on Sepolia, and those that must not.
const VISIBLE_ON_SEPOLIA = ['Local Sepolia', 'WS Sepolia Only', 'WS Multichain']
const HIDDEN_ON_SEPOLIA = ['Local Mainnet', 'WS Mainnet Only', 'WS Polygon Only']

const SPACE = {
  id: Number(DROPDOWN_TEST_SPACE.id),
  uuid: DROPDOWN_TEST_SPACE.id,
  name: DROPDOWN_TEST_SPACE.name,
  status: 'ACTIVE',
  safeCount: 1,
  members: [{ id: 1, role: 'ADMIN', name: 'Admin', status: 'ACTIVE', user: { id: 1, status: 'ACTIVE' } }],
}

test.describe('Recipient dropdown — network filtering', { tag: '@regression' }, () => {
  test('should only suggest contacts on the transaction chain (Sepolia), never mainnet or polygon', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // Fake a Spaces session and seed local contacts on two chains. Only the
    // Sepolia local contact should ever load (locals are stored per chain).
    await safePage.addInitScript(
      ({ ns, spaceId, localBook }) => {
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
        window.localStorage.setItem(`${ns}addressBook`, JSON.stringify(localBook))
      },
      {
        ns: LS_NAMESPACE,
        spaceId: DROPDOWN_TEST_SPACE.id,
        localBook: {
          [CHAIN_IDS.sepolia]: { [LOCAL_SEPOLIA.address]: LOCAL_SEPOLIA.name },
          [CHAIN_IDS.ethereum]: { [LOCAL_MAINNET.address]: LOCAL_MAINNET.name },
        },
      },
    )

    // Mock auth + spaces endpoints. The workspace address book returns contacts
    // across chains; the frontend is what filters them down to the tx chain.
    await safePage.route(/\/v1\/auth\/me(\?.*)?$/, (route) =>
      route.fulfill({ json: { id: '1', authMethod: 'siwe', signerAddress: SIGNER } }),
    )
    await safePage.route(/\/v1\/users(\?.*)?$/, (route) =>
      route.fulfill({ json: { id: 1, status: 1, wallets: [{ id: 1, address: SIGNER }] } }),
    )
    await safePage.route(/\/v1\/spaces\/[^/]+\/address-book(\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          spaceId: DROPDOWN_TEST_SPACE.id,
          spaceUuid: DROPDOWN_TEST_SPACE.id,
          data: WORKSPACE_CONTACTS.map((c) => ({
            name: c.name,
            address: c.address,
            chainIds: c.chainIds,
            createdBy: '',
            createdByUserId: 0,
            lastUpdatedBy: '',
            lastUpdatedByUserId: 0,
            createdAt: '',
            updatedAt: '',
          })),
        },
      }),
    )
    await safePage.route(/\/v1\/spaces\/[^/]+\/members(\?.*)?$/, (route) => route.fulfill({ json: SPACE.members }))
    await safePage.route(/\/v1\/spaces\/[^/]+\/safes(\?.*)?$/, (route) => route.fulfill({ json: { safes: {} } }))
    await safePage.route(/\/v1\/spaces\/[^/]+(\?.*)?$/, (route) => route.fulfill({ json: SPACE }))
    await safePage.route(/\/v1\/spaces(\?.*)?$/, (route) => route.fulfill({ json: [SPACE] }))

    // Open a Sepolia Safe and connect the owner wallet (enables "New transaction").
    await safePage.goto(`/home?safe=${SAFES.SEP_OWNER_4_SAFE}`)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    // Open the Send-tokens flow and the recipient dropdown.
    await expect(safePage.getByTestId('new-tx-btn')).toBeEnabled()
    await safePage.getByTestId('new-tx-btn').click()
    await safePage.getByTestId('send-tokens-btn').click()
    await safePage.getByRole('combobox', { name: /Recipient address/ }).click()

    // Wait for the dropdown to populate (the first Sepolia contact renders).
    const optionByName = (name: string) => safePage.getByTestId('address-item').filter({ hasText: name })
    await expect(optionByName('WS Sepolia Only')).toBeVisible()

    // Sepolia-eligible contacts are suggested.
    for (const name of VISIBLE_ON_SEPOLIA) {
      await expect(optionByName(name)).toBeVisible()
    }

    // Contacts only on other networks are never suggested.
    for (const name of HIDDEN_ON_SEPOLIA) {
      await expect(optionByName(name)).toHaveCount(0)
    }
  })
})
