import { fireEvent, render, screen } from '@testing-library/react'
import SpaceSafeAccounts from '../index'
import type { SafeItem } from '@/hooks/safes'

const mockUseSpaceSafes = jest.fn()

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

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
  useIsInvited: () => false,
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

jest.mock('@/hooks/safes', () => ({
  useAllOwnedSafes: () => [{}, undefined, false],
  useSafeOrderComparator: () => () => 0,
  useSafeItemBuilder: () => ({
    buildSafeItem: (chainId: string, address: string) => ({ chainId, address, name: address }),
    walletAddress: '',
    isWalletConnected: false,
    allOwned: {},
    ownedError: undefined,
    ownedLoading: false,
  }),
  _getMultiChainAccounts: () => [],
  _getSingleChainAccounts: (items: SafeItem[]) => items,
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
jest.mock('@/store/slices', () => ({
  selectAllAddressBooks: jest.fn(),
  selectAllVisitedSafes: jest.fn(),
  selectUndeployedSafes: jest.fn(),
}))

jest.mock('@/features/myAccounts', () => ({
  SafeAccountsTable: ({ items }: { items: Array<{ name?: string; address: string }> }) => (
    <div data-testid="safe-accounts-table">
      {items.map((item) => (
        <div key={item.address}>{item.name}</div>
      ))}
    </div>
  ),
}))

jest.mock('../SpaceSafeContextMenu', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../EmptySafeAccounts', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-safe-accounts" />,
}))

jest.mock('../../InviteBanner/PreviewInvite', () => ({ __esModule: true, default: () => null }))

const spaceSafes = [
  { chainId: '1', address: 'Treasury' },
  { chainId: '100', address: 'Marketing' },
]

describe('SpaceSafeAccounts', () => {
  beforeEach(() => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: spaceSafes, isError: false, error: null, refetch: jest.fn() })
  })

  it('renders the AddAccountsChooser with the "Add accounts" label', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveTextContent('Add accounts')
  })

  it('passes "safe_accounts" as the entryPoint to AddAccountsChooser', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('add-accounts-chooser')).toHaveAttribute('data-entry-point', 'safe_accounts')
  })

  it('does not render the Workspace/Trusted tabs', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByText('Trusted')).not.toBeInTheDocument()
  })

  it('shows all workspace accounts without a search query', () => {
    render(<SpaceSafeAccounts />)

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
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
