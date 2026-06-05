import { render, screen } from '@/tests/test-utils'
import type { SafeItem } from '@/hooks/safes'
import { useAccountsModalItems } from './useAccountsModalItems'
import AccountsModal from './index'

jest.mock('./useAccountsModalItems', () => ({
  useAccountsModalItems: jest.fn(),
}))

jest.mock('./SafeItemCard', () => {
  const MockSafeItemCard = ({
    safeItem,
    hidePinControls,
  }: {
    safeItem: { chainId: string; address: string }
    hidePinControls?: boolean
  }) => (
    <div
      data-testid="safe-item-card-mock"
      data-key={`${safeItem.chainId}:${safeItem.address}`}
      data-hide-pin={String(Boolean(hidePinControls))}
    />
  )
  MockSafeItemCard.displayName = 'SafeItemCard'
  return { __esModule: true, default: MockSafeItemCard }
})

jest.mock('./MultiSafeItemCard', () => {
  const MockMultiSafeItemCard = ({
    item,
    hidePinControls,
  }: {
    item: { address: string }
    hidePinControls?: boolean
  }) => (
    <div
      data-testid="multi-safe-item-card-mock"
      data-address={item.address}
      data-hide-pin={String(Boolean(hidePinControls))}
    />
  )
  MockMultiSafeItemCard.displayName = 'MultiSafeItemCard'
  return { __esModule: true, default: MockMultiSafeItemCard }
})

const mockUseAccountsModalItems = useAccountsModalItems as jest.Mock

const safeItem = (chainId: string, address: string, overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const buildHookReturn = (overrides: Partial<ReturnType<typeof useAccountsModalItems>> = {}) => ({
  trustedItems: [],
  otherItems: [safeItem('1', ADDR_A)],
  similarAddresses: new Set<string>(),
  isLoading: false,
  isOwnedSafesError: false,
  refetchOwnedSafes: jest.fn(),
  isQualifiedSafe: false,
  ...overrides,
})

describe('AccountsModal', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn())
  })

  it('shows the "All Accounts" dialog title when not in a qualified space', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ isQualifiedSafe: false }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByText('All Accounts')).toBeInTheDocument()
  })

  it('shows the "Explore other Safes" dialog title when in a qualified space', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ isQualifiedSafe: true }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByText('Explore other Safes')).toBeInTheDocument()
    expect(screen.queryByText('All Accounts')).not.toBeInTheDocument()
  })

  it('passes hidePinControls=false to cards when not in a qualified space', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ isQualifiedSafe: false }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-hide-pin')).toBe('false')
  })

  it('passes hidePinControls=true to cards when in a qualified space', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ isQualifiedSafe: true }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-hide-pin')).toBe('true')
  })

  it('renders the empty state when no items match', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [] }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
  })

  it('renders the loading skeleton while isLoading is true', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [], isLoading: true }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.queryByTestId('empty-pinned-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-item-card-mock')).not.toBeInTheDocument()
  })

  it('renders the similar-address warning banner when at least one similar address is detected', () => {
    mockUseAccountsModalItems.mockReturnValue(
      buildHookReturn({
        similarAddresses: new Set([ADDR_A.toLowerCase()]),
      }),
    )

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('similar-address-alert')).toBeInTheDocument()
  })

  it('hides the similar-address warning banner when no similar addresses are detected', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ similarAddresses: new Set<string>() }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.queryByTestId('similar-address-alert')).not.toBeInTheDocument()
  })
})
