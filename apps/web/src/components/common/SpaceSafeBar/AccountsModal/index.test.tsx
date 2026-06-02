import { render, screen } from '@/tests/test-utils'
import { useIsQualifiedSafe } from '@/features/spaces'
import type { SafeItem } from '@/hooks/safes'
import { useAccountsModalItems } from './useAccountsModalItems'
import AccountsModal from './index'

jest.mock('@/features/spaces', () => ({
  useIsQualifiedSafe: jest.fn(),
}))

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

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
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

describe('AccountsModal', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseAccountsModalItems.mockReturnValue({
      trustedItems: [],
      otherItems: [safeItem('1', ADDR_A)],
      similarAddresses: new Set<string>(),
      isLoading: false,
      isOwnedSafesError: false,
      refetchOwnedSafes: jest.fn(),
    })
  })

  it('shows the "All Accounts" dialog title when not in a qualified space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByText('All Accounts')).toBeInTheDocument()
  })

  it('shows the "Safes not in this Workspace" dialog title when in a qualified space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByText('Safes not in this Workspace')).toBeInTheDocument()
    expect(screen.queryByText('All Accounts')).not.toBeInTheDocument()
  })

  it('passes hidePinControls=false to cards when not in a qualified space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-hide-pin')).toBe('false')
  })

  it('passes hidePinControls=true to cards when in a qualified space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-hide-pin')).toBe('true')
  })

  it('renders the empty state when no items match', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseAccountsModalItems.mockReturnValue({
      trustedItems: [],
      otherItems: [],
      similarAddresses: new Set<string>(),
      isLoading: false,
      isOwnedSafesError: false,
      refetchOwnedSafes: jest.fn(),
    })

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
  })

  it('renders the loading skeleton while isLoading is true', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseAccountsModalItems.mockReturnValue({
      trustedItems: [],
      otherItems: [],
      similarAddresses: new Set<string>(),
      isLoading: true,
      isOwnedSafesError: false,
      refetchOwnedSafes: jest.fn(),
    })

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.queryByTestId('empty-pinned-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-item-card-mock')).not.toBeInTheDocument()
  })
})
