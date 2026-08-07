/**
 * Regression — the workspace Members table renders members and sorts by column.
 *
 * This PR rewrote the Members (Team) table off the legacy MUI `EnhancedTable`
 * onto the shared `PaginatedDataTable` and added client-side column sorting.
 * This guards the core team-management view: members must render as rows, and
 * clicking the sortable "Name" header must re-order them (asc on first click).
 *
 * Setup mirrors the proven spaces pattern (see recipient-dropdown-network-filter):
 * a faked Spaces session via localStorage + a mocked `/v1/auth/me` (so the
 * session-expiry guard doesn't clear it) + mocked spaces endpoints. The Members
 * page is gated on the SIWE session, not a connected wallet, so no wallet is
 * connected here. Members are returned in a deliberately non-alphabetical order
 * (Charlie, Alice, Bob) so the sort is observable.
 *
 * Run: yarn workspace @safe-global/web pw:test spaces-members-table
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { LS_NAMESPACE } from '../../src/data/constants'

const SIGNER = '0x1234567890123456789012345678901234567890'
const SPACE_ID = '00000000-0000-0000-0000-0000000000aa'

const SPACE = {
  id: 1,
  uuid: SPACE_ID,
  name: 'Test Workspace',
  status: 'ACTIVE',
  safeCount: 0,
  members: [{ id: 1, role: 'ADMIN', name: 'Admin', status: 'ACTIVE', user: { id: 1, status: 'ACTIVE' } }],
}

// Deliberately non-alphabetical so the Name sort is observable.
const member = (id: number, name: string, email: string) => ({
  id,
  role: 'MEMBER',
  status: 'ACTIVE',
  name,
  invitedBy: null,
  inviteExpiresAt: null,
  createdAt: '',
  updatedAt: '',
  user: { id, status: 'ACTIVE', email },
})

const MEMBERS = [
  member(1, 'Charlie', 'charlie@example.com'),
  member(2, 'Alice', 'alice@example.com'),
  member(3, 'Bob', 'bob@example.com'),
]

const API_ORDER = ['Charlie', 'Alice', 'Bob']
const NAME_ASC = ['Alice', 'Bob', 'Charlie']

test.describe('Spaces — Members table', { tag: '@regression' }, () => {
  test('should render workspace members and sort them by name when the Name header is clicked', async ({
    safePage,
    walletPage,
  }) => {
    // Fake a Spaces session so the SIWE-gated workspace pages render.
    await safePage.addInitScript(
      ({ ns, spaceId }) => {
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
      },
      { ns: LS_NAMESPACE, spaceId: SPACE_ID },
    )

    // Mock auth + spaces endpoints. The members endpoint returns the rows the
    // table renders; everything else is the minimum to establish the session.
    await safePage.route(/\/v1\/auth\/me(\?.*)?$/, (route) =>
      route.fulfill({ json: { id: '1', authMethod: 'siwe', signerAddress: SIGNER } }),
    )
    await safePage.route(/\/v1\/users(\?.*)?$/, (route) =>
      route.fulfill({ json: { id: 1, status: 1, wallets: [{ id: 1, address: SIGNER }] } }),
    )
    await safePage.route(/\/v1\/spaces\/[^/]+\/members(\?.*)?$/, (route) =>
      route.fulfill({ json: { members: MEMBERS } }),
    )
    await safePage.route(/\/v1\/spaces\/[^/]+\/safes(\?.*)?$/, (route) => route.fulfill({ json: { safes: {} } }))
    await safePage.route(/\/v1\/spaces\/[^/]+(\?.*)?$/, (route) => route.fulfill({ json: SPACE }))
    await safePage.route(/\/v1\/spaces(\?.*)?$/, (route) => route.fulfill({ json: [SPACE] }))

    await safePage.goto(`/spaces/members?spaceId=${SPACE_ID}`)
    await walletPage.acceptCookies()

    // All three members render as rows in the (now shared) table.
    const nameCells = safePage.getByTestId('table-cell-name')
    await expect(nameCells).toHaveCount(MEMBERS.length)
    for (const name of API_ORDER) {
      await expect(nameCells.filter({ hasText: name })).toBeVisible()
    }

    // Rows start in API order…
    await expect(nameCells.first()).toContainText(API_ORDER[0]!)

    // …and sort ascending by name when the sortable Name header is clicked.
    await safePage.getByRole('button', { name: /Name/ }).click()
    await expect(nameCells.first()).toContainText(NAME_ASC[0]!)
    await expect(nameCells.last()).toContainText(NAME_ASC[NAME_ASC.length - 1]!)
  })
})
