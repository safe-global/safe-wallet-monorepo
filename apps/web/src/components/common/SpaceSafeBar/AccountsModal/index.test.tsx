import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import type { SafeItem } from '@/hooks/safes'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { useAccountsModalItems } from './useAccountsModalItems'
import AccountsModal from './index'

jest.mock('./useAccountsModalItems', () => ({
  useAccountsModalItems: jest.fn(),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/spaces/components/ConnectWalletHint', () => {
  const MockConnectWalletHint = ({ onConnect }: { onConnect?: () => void }) => (
    <button data-testid="connect-wallet-hint" onClick={onConnect}>
      Connect
    </button>
  )
  MockConnectWalletHint.displayName = 'ConnectWalletHint'
  return { __esModule: true, default: MockConnectWalletHint }
})

jest.mock('./SafeItemCard', () => {
  const MockSafeItemCard = ({
    safeItem,
    openSafeTrackingLabel,
  }: {
    safeItem: { chainId: string; address: string }
    openSafeTrackingLabel?: string
  }) => (
    <div
      data-testid="safe-item-card-mock"
      data-key={`${safeItem.chainId}:${safeItem.address}`}
      data-open-label={openSafeTrackingLabel}
    />
  )
  MockSafeItemCard.displayName = 'SafeItemCard'
  return { __esModule: true, default: MockSafeItemCard }
})

jest.mock('./MultiSafeItemCard', () => {
  const MockMultiSafeItemCard = ({ item }: { item: { address: string } }) => (
    <div data-testid="multi-safe-item-card-mock" data-address={item.address} />
  )
  MockMultiSafeItemCard.displayName = 'MultiSafeItemCard'
  return { __esModule: true, default: MockMultiSafeItemCard }
})

const mockUseAccountsModalItems = useAccountsModalItems as jest.Mock
const mockUseWallet = useWallet as jest.Mock
const mockUseConnectWallet = useConnectWallet as jest.Mock

const connectedWallet = { address: '0x1234567890123456789012345678901234567890' } as unknown as ReturnType<
  typeof useWallet
>

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
    mockUseWallet.mockReturnValue(connectedWallet)
    mockUseConnectWallet.mockReturnValue(jest.fn().mockResolvedValue(undefined))
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

  it('renders the empty state when no items match', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [] }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
  })

  it('renders the Manage trusted Safes action in the Trusted Safes section', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [safeItem('1', ADDR_A)] }))

    render(<AccountsModal open onClose={jest.fn()} onManageTrustedSafes={jest.fn()} />)

    expect(screen.getByTestId('manage-trusted-safes-link')).toBeInTheDocument()
  })

  it('keeps the Trusted Safes section and action visible when there are no trusted safes', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [] }))

    render(<AccountsModal open onClose={jest.fn()} onManageTrustedSafes={jest.fn()} />)

    expect(screen.getByTestId('pinned-accounts')).toBeInTheDocument()
    expect(screen.getByTestId('manage-trusted-safes-link')).toBeInTheDocument()
    expect(screen.getByText('No trusted Safes yet')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-pinned-list')).not.toBeInTheDocument()
  })

  it('closes the modal and opens the trusted-safes modal when Manage is clicked', () => {
    const onClose = jest.fn()
    const onManageTrustedSafes = jest.fn()
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [] }))

    render(<AccountsModal open onClose={onClose} onManageTrustedSafes={onManageTrustedSafes} />)

    fireEvent.click(screen.getByTestId('manage-trusted-safes-link'))

    expect(onClose).toHaveBeenCalled()
    expect(onManageTrustedSafes).toHaveBeenCalled()
  })

  it('does not render the Manage action when onManageTrustedSafes is not provided', () => {
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [safeItem('1', ADDR_A)] }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.queryByTestId('manage-trusted-safes-link')).not.toBeInTheDocument()
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

  it('shows the connect-wallet hint and still lists local safes when no wallet is connected', () => {
    mockUseWallet.mockReturnValue(null)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('connect-wallet-hint')).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-card-mock')).toBeInTheDocument()
  })

  it('shows the connect-wallet hint even when the list is empty and no wallet is connected', () => {
    mockUseWallet.mockReturnValue(null)
    mockUseAccountsModalItems.mockReturnValue(buildHookReturn({ trustedItems: [], otherItems: [] }))

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('connect-wallet-hint')).toBeInTheDocument()
    expect(screen.getByTestId('empty-pinned-list')).toBeInTheDocument()
  })

  it('hides the connect-wallet hint when a wallet is connected', () => {
    mockUseWallet.mockReturnValue(connectedWallet)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.queryByTestId('connect-wallet-hint')).not.toBeInTheDocument()
  })

  it('unmounts the dialog while connecting so the wallet-connect modal can come to the front', async () => {
    mockUseWallet.mockReturnValue(null)
    let resolveConnect: () => void = () => {}
    const connect = jest.fn(() => new Promise<void>((resolve) => (resolveConnect = resolve)))
    mockUseConnectWallet.mockReturnValue(connect)

    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByText('All Accounts')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('connect-wallet-hint'))

    // Dialog disappears while the connect modal is open
    await waitFor(() => expect(screen.queryByText('All Accounts')).not.toBeInTheDocument())
    expect(connect).toHaveBeenCalled()

    // ...and comes back once connecting resolves
    resolveConnect()
    await waitFor(() => expect(screen.getByText('All Accounts')).toBeInTheDocument())
  })

  it('forwards the default top_bar tracking label to cards', () => {
    render(<AccountsModal open onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-open-label')).toBe('top_bar')
  })

  it('forwards a custom tracking label to cards', () => {
    render(<AccountsModal open onClose={jest.fn()} trackingLabel={OVERVIEW_LABELS.owned_safes_modal} />)

    expect(screen.getByTestId('safe-item-card-mock').getAttribute('data-open-label')).toBe('owned_safes_modal')
  })

  it('appends the originating page as `next` on the Add existing and Create new links', () => {
    render(<AccountsModal open onClose={jest.fn()} />, {
      routerProps: { pathname: '/spaces', query: { spaceId: '1' } },
    })

    const addHref = screen.getByTestId('add-safe-button').getAttribute('href') ?? ''
    const addUrl = new URL(addHref, 'http://localhost')
    expect(addUrl.pathname).toBe('/new-safe/load')
    expect(addUrl.searchParams.get('next')).toBe('/spaces?spaceId=1')

    const createHref = screen.getByRole('link', { name: /Create new/i }).getAttribute('href') ?? ''
    const createUrl = new URL(createHref, 'http://localhost')
    expect(createUrl.pathname).toBe('/new-safe/create')
    expect(createUrl.searchParams.get('next')).toBe('/spaces?spaceId=1')
  })
})
