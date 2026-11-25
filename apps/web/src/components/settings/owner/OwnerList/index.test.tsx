import { render, screen } from '@/tests/test-utils'
import { mockChainId, mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { addressExBuilder } from '@/tests/builders/safe'
import { spaceAddressBookItemBuilder } from '@/tests/builders/space'
import useGetSpaceAddressBook from '@/features/spaces/public/hooks/useGetSpaceAddressBook'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { OwnerList } from '.'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('@/features/spaces/public/hooks/useGetSpaceAddressBook', () => ({
  ...jest.requireActual('@/features/spaces/public/hooks/useGetSpaceAddressBook'),
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary', () => ({
  ...jest.requireActual('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary'),
  __esModule: true,
  default: jest.fn(),
}))

const { REPLACE_OWNER, REMOVE_OWNER } = SETTINGS_EVENTS.SETUP

const trackedButtons = ({ category, action }: { category: string; action: string }) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-track="${category}: ${action}"] button`))

const getGatedButtons = () => [
  screen.getByTestId('manage-signers-btn'),
  ...trackedButtons(REPLACE_OWNER),
  ...trackedButtons(REMOVE_OWNER),
]

const renderOwnerList = async () => {
  render(<OwnerList />)
  await screen.findByTestId('manage-signers-btn')
}

// The current chain is the Safe's, as on the Safe's own pages
const mockSafeWithOwners = (ownerCount: number) => {
  const safe = mockSafeInfo({
    deployed: true,
    owners: Array.from({ length: ownerCount }, () => addressExBuilder().build()),
  })
  mockChainId(safe.chainId)
  return safe
}

describe('OwnerList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([])
    mockSafeWithOwners(2)
  })

  it.each(['owner', 'proposer', 'nestedOwner'] as const)(
    'enables Manage signers, Replace and Remove for %s',
    async (role) => {
      mockRole(role)

      await renderOwnerList()

      const buttons = getGatedButtons()
      expect(buttons).toHaveLength(5)
      buttons.forEach((button) => expect(button).toBeEnabled())
    },
  )

  it.each(['nonOwner', 'spendingLimitBeneficiary', 'disconnected'] as const)(
    'disables Manage signers, Replace and Remove for %s',
    async (role) => {
      mockRole(role)

      await renderOwnerList()

      const buttons = getGatedButtons()
      expect(buttons).toHaveLength(5)
      buttons.forEach((button) => expect(button).toBeDisabled())
    },
  )

  it('shows no Remove button for a single-owner Safe', async () => {
    mockRole('owner')
    mockSafeWithOwners(1)

    await renderOwnerList()

    expect(trackedButtons(REPLACE_OWNER)).toHaveLength(1)
    expect(trackedButtons(REMOVE_OWNER)).toHaveLength(0)
  })

  it.each(['owner', 'disconnected'] as const)(
    'names the Replace and Remove button of each signer for %s',
    async (role) => {
      mockRole(role)

      await renderOwnerList()

      expect(screen.getAllByRole('button', { name: 'Replace signer' })).toHaveLength(2)
      expect(screen.getAllByRole('button', { name: 'Remove signer' })).toHaveLength(2)
    },
  )

  it('lets only a signer without a Workspace name be renamed here', async () => {
    mockRole('owner')
    const safe = mockSafeWithOwners(2)
    const [named] = safe.owners
    const workspaceContact = spaceAddressBookItemBuilder()
      .with({ address: named.value, chainIds: [safe.chainId] })
      .build()
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([workspaceContact])

    await renderOwnerList()

    expect(screen.getByText(workspaceContact.name)).toBeInTheDocument()
    const [namedEdit, unnamedEdit] = screen.getAllByRole('button', { name: 'Edit signer' })
    expect(namedEdit).toBeDisabled()
    expect(unnamedEdit).toBeEnabled()
  })
})
