import { fireEvent, render, screen } from '@testing-library/react'
import SpaceSafeAccounts from '../index'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'

const mockUseSpaceSafes = jest.fn()
const mockUseIsAdmin = jest.fn()

jest.mock('@/features/address-poisoning/hooks/useSimilarityClusters', () => ({
  __esModule: true,
  default: () => ({ flagged: new Set<string>(), groupIdByAddress: new Map<string, string>() }),
}))

jest.mock('../../AddAccountsChooser', () => ({
  __esModule: true,
  default: ({ buttonLabel, entryPoint }: { buttonLabel?: string; entryPoint?: string }) => (
    <button data-testid="add-accounts-chooser" data-entry-point={entryPoint}>
      {buttonLabel ?? 'Add accounts'}
    </button>
  ),
}))

jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

jest.mock('@/features/spaces/hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))
jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsInvited: () => false,
  useIsAdmin: () => mockUseIsAdmin(),
}))
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => 'space-1',
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

jest.mock('@/components/common/SafeListSortToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-list-sort-toggle" />,
}))

jest.mock('@/hooks/safes/useAllOwnedSafes', () => ({
  __esModule: true,
  default: () => [{}, undefined, false],
}))
jest.mock('@/hooks/safes/useSafeOrderComparator', () => ({
  useSafeOrderComparator: () => () => 0,
}))
jest.mock('@/hooks/safes/useSaveManualOrder', () => ({
  useSaveManualOrder: () => jest.fn(),
}))
jest.mock('@/hooks/safes/useAllSafesGrouped', () => ({
  flattenSafeItems: (items: Array<SafeItem & { safes?: SafeItem[] }>): SafeItem[] =>
    items.flatMap((item) => (item.safes ? item.safes : [item])),
  _groupAndSort: (items: SafeItem[], cmp: (a: SafeItem, b: SafeItem) => number) => [...items].sort(cmp),
}))
jest.mock('@/hooks/safes/useSafesSearch', () => ({
  useSafesSearch: (safes: Array<{ name?: string }>, query: string) =>
    query ? safes.filter((safe) => safe.name?.toLowerCase().includes(query.toLowerCase())) : [],
}))

jest.mock('@safe-global/utils/hooks/useDebounce', () => ({
  __esModule: true,
  default: (value: string) => value,
}))

jest.mock('@/store', () => ({
  useAppSelector: () => ({}),
  useAppDispatch: () => jest.fn(),
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({
  selectOrderByPreference: jest.fn(),
  setManualOrder: jest.fn(),
  getSpaceOrderScope: (id: string) => `space:${id}`,
  OrderByOption: { NAME: 'name', LAST_VISITED: 'lastVisited', MANUAL: 'manual' },
}))
jest.mock('@/store/addedSafesSlice', () => ({ selectAllAddedSafes: jest.fn() }))
jest.mock('@/store/addressBookSlice', () => ({
  selectAllAddressBooks: jest.fn(),
}))
jest.mock('@/store/visitedSafesSlice', () => ({
  selectAllVisitedSafes: jest.fn(),
}))
jest.mock('@/features/counterfactual/store/undeployedSafesSlice', () => ({
  selectUndeployedSafes: jest.fn(),
}))

jest.mock('@/features/myAccounts/components/SafeAccountsTable', () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ name?: string; address: string; chainId?: string }> }) => (
    <div data-testid="safe-accounts-table">
      {items.map((item) => (
        <div key={`${item.chainId}:${item.address}`}>{item.name}</div>
      ))}
    </div>
  ),
}))

jest.mock('../SpaceSafeContextMenu', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@safe-global/views/features/spaces/components/SafeAccounts/EmptySafeAccounts', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-safe-accounts" />,
}))

jest.mock('../../InviteBanner/PreviewInvite', () => ({ __esModule: true, default: () => null }))

const mockUseSeatUpsell = jest.fn()
jest.mock('../../../hooks/useSeatUpsell', () => ({ useSeatUpsell: () => mockUseSeatUpsell() }))
jest.mock('../../Plans/PlanStatusCard', () => ({ seatsTooltip: (tier: string, limit: number) => `${tier}/${limit}` }))

const spaceSafes = [
  { chainId: '1', address: '0xTreasury', name: 'Treasury' },
  { chainId: '100', address: '0xMarketing', name: 'Marketing' },
]

describe('SpaceSafeAccounts', () => {
  beforeEach(() => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: spaceSafes, isError: false, error: null, refetch: jest.fn() })
    mockUseIsAdmin.mockReturnValue(true)
    mockUseSeatUpsell.mockReturnValue({
      isSafePro: false,
      tierName: undefined,
      limit: null,
      plansHref: '/spaces/plans',
    })
  })

  it('counts the seats in use under Safe Pro and flags the limit with the banner', () => {
    mockUseSeatUpsell.mockReturnValue({ isSafePro: true, tierName: 'Business', limit: 20, plansHref: '/spaces/plans' })
    const { rerender } = render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 20')
    expect(screen.getByTestId('selected-count')).not.toHaveTextContent('selected')
    expect(screen.queryByTestId('seat-limit-banner')).not.toBeInTheDocument()

    mockUseSeatUpsell.mockReturnValue({ isSafePro: true, tierName: 'Business', limit: 2, plansHref: '/spaces/plans' })
    rerender(<SpaceSafeAccounts />)
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 2')
    expect(screen.getByTestId('seat-limit-banner')).toHaveTextContent('The Business plan includes 2 Safe accounts')
  })

  it('counts a Safe on several chains as one seat', () => {
    mockUseSpaceSafes.mockReturnValue({
      allSafes: [...spaceSafes, { chainId: '10', address: '0xTreasury', name: 'Treasury' }],
      isError: false,
      error: null,
      refetch: jest.fn(),
    })
    mockUseSeatUpsell.mockReturnValue({ isSafePro: true, tierName: 'Business', limit: 2, plansHref: '/spaces/plans' })

    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 2')
  })

  it('shows neither counter nor banner without Safe Pro', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.queryByTestId('selected-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('seat-limit-banner')).not.toBeInTheDocument()
  })

  it('renders the AddAccountsChooser with the "Add accounts" label', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveTextContent('Add accounts')
  })

  it('passes "safe_accounts" as the entryPoint to AddAccountsChooser', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveAttribute('data-entry-point', 'safe_accounts')
  })

  it('hides the AddAccountsChooser for members (non-admins)', () => {
    mockUseIsAdmin.mockReturnValue(false)

    render(<SpaceSafeAccounts />)

    expect(screen.queryByTestId('add-accounts-chooser')).not.toBeInTheDocument()
    // The rest of the page still renders for members
    expect(screen.getByTestId('space-safe-accounts-search-input')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
  })

  it('does not render the workspace/Trusted tabs', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByText('Trusted')).not.toBeInTheDocument()
  })

  it('shows all workspace accounts without a search query', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
  })

  // Regression: the page must render the name useSpaceSafes already resolved (workspace-priority),
  // not re-derive it from the local address book — which would fall back to the address here.
  it('renders the workspace-resolved name rather than rebuilding from the local address book', () => {
    mockUseSpaceSafes.mockReturnValue({
      allSafes: [{ chainId: '1', address: '0xWHYY', name: 'whyy in the space' }],
      isError: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SpaceSafeAccounts />)

    expect(screen.getByText('whyy in the space')).toBeInTheDocument()
    expect(screen.queryByText('0xWHYY')).not.toBeInTheDocument()
  })

  it('filters accounts by the search query', () => {
    render(<SpaceSafeAccounts />)

    fireEvent.change(screen.getByTestId('space-safe-accounts-search-input'), { target: { value: 'treas' } })

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument()
  })

  it('shows an empty message when no accounts match the search', () => {
    render(<SpaceSafeAccounts />)

    fireEvent.change(screen.getByTestId('space-safe-accounts-search-input'), { target: { value: 'nomatch' } })

    expect(screen.getByText('No Safe accounts match your search')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
  })

  it('shows the empty state and hides the search input when the space has no accounts', () => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: [], isError: false, error: null, refetch: jest.fn() })

    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('empty-safe-accounts')).toBeInTheDocument()
    expect(screen.queryByTestId('space-safe-accounts-search-input')).not.toBeInTheDocument()
  })
})
