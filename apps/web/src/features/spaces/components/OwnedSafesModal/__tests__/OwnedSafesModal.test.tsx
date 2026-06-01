import { render, screen, fireEvent } from '@/tests/test-utils'
import OwnedSafesModal from '../index'

let mockWalletAddress: string | null = '0xWallet'
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => (mockWalletAddress ? { address: mockWalletAddress } : null),
}))

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

let mockChains: Array<{ chainId: string }> = [{ chainId: '1' }, { chainId: '137' }]
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

let mockAllOwned: Record<string, string[]> = {}
let mockOwnedError: unknown = undefined
let mockOwnedLoading = false
jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return {
    ...actual,
    useAllOwnedSafes: () => [mockAllOwned, mockOwnedError, mockOwnedLoading] as const,
    useSafeItemBuilder: () => ({
      buildSafeItem: (chainId: string, address: string) => ({
        chainId,
        address,
        name: '',
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
      }),
      walletAddress: mockWalletAddress ?? '',
      isWalletConnected: !!mockWalletAddress,
      allOwned: mockAllOwned,
      ownedError: mockOwnedError,
      ownedLoading: mockOwnedLoading,
    }),
    _getMultiChainAccounts: () => [],
    _getSingleChainAccounts: (items: unknown[]) => items,
    isMultiChainSafeItem: () => false,
  }
})

jest.mock('@/components/common/SpaceSafeBar/AccountsModal/SafeItemCard', () => ({
  __esModule: true,
  default: ({ safeItem }: { safeItem: { chainId: string; address: string } }) => (
    <div data-testid="safe-item-card" data-chain={safeItem.chainId} data-address={safeItem.address} />
  ),
}))

jest.mock('@/components/common/SpaceSafeBar/AccountsModal/MultiSafeItemCard', () => ({
  __esModule: true,
  default: () => <div data-testid="multi-safe-item-card" />,
}))

jest.mock('@/components/common/SpaceSafeBar/AccountsModal/shared', () => ({
  __esModule: true,
  SafeListSkeleton: () => <div data-testid="safe-list-skeleton" />,
}))

const noop = () => {}

const undeployedWithOwner = (ownerAddr: string) => ({
  props: { safeAccountConfig: { owners: [ownerAddr], threshold: 1 } },
  status: { type: 'AWAITING_EXECUTION' },
})

describe('OwnedSafesModal', () => {
  beforeEach(() => {
    mockWalletAddress = '0xWallet'
    mockChains = [{ chainId: '1' }, { chainId: '137' }]
    mockAllOwned = {}
    mockOwnedError = undefined
    mockOwnedLoading = false
    mockConnectWallet.mockClear()
    mockTrackEvent.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders nothing when open is false', () => {
    const { container } = render(<OwnedSafesModal open={false} onClose={noop} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the connect-wallet prompt when no wallet is connected', () => {
    mockWalletAddress = null

    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByTestId('owned-safes-connect-wallet-button')).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet to access all your Safes')).toBeInTheDocument()
  })

  it('hides the search input and footer when no wallet is connected', () => {
    mockWalletAddress = null

    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.queryByTestId('owned-safes-search-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('owned-safes-add-existing')).not.toBeInTheDocument()
    expect(screen.queryByTestId('owned-safes-create-new')).not.toBeInTheDocument()
  })

  it('triggers connectWallet without closing the modal when the connect button is clicked', () => {
    mockWalletAddress = null
    const onClose = jest.fn()

    render(<OwnedSafesModal open onClose={onClose} />)

    fireEvent.click(screen.getByTestId('owned-safes-connect-wallet-button'))

    expect(mockConnectWallet).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('swaps from the connect-wallet prompt to the owned-safes list once a wallet connects', () => {
    mockWalletAddress = null
    mockAllOwned = { '1': ['0xSafe1'] }

    const { rerender } = render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByTestId('owned-safes-connect-wallet-button')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-item-card')).not.toBeInTheDocument()

    mockWalletAddress = '0xWallet'
    rerender(<OwnedSafesModal open onClose={noop} />)

    expect(screen.queryByTestId('owned-safes-connect-wallet-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-item-card')).toBeInTheDocument()
  })

  it('renders the footer buttons when a wallet is connected', () => {
    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByTestId('owned-safes-add-existing')).toBeInTheDocument()
    expect(screen.getByTestId('owned-safes-create-new')).toBeInTheDocument()
  })

  it('renders deployed owned Safes returned from the owners endpoint', () => {
    mockAllOwned = { '1': ['0xSafe1'], '137': ['0xSafe2'] }

    render(<OwnedSafesModal open onClose={noop} />)

    const cards = screen.getAllByTestId('safe-item-card')
    const addresses = cards.map((c) => c.getAttribute('data-address'))
    expect(addresses).toContain('0xSafe1')
    expect(addresses).toContain('0xSafe2')
  })

  it('renders counterfactual Safes whose owners include the connected wallet', () => {
    mockAllOwned = {}
    const undeployed = { '1': { '0xUndeployed': undeployedWithOwner('0xWallet') } }
    jest.spyOn(require('@/store/slices'), 'selectUndeployedSafes').mockReturnValue(undeployed)

    render(<OwnedSafesModal open onClose={noop} />)

    const cards = screen.getAllByTestId('safe-item-card')
    expect(cards.some((c) => c.getAttribute('data-address') === '0xUndeployed')).toBe(true)
  })

  it('excludes counterfactual Safes whose owners do not include the wallet', () => {
    mockAllOwned = {}
    const undeployed = { '1': { '0xNotMine': undeployedWithOwner('0xSomeoneElse') } }
    jest.spyOn(require('@/store/slices'), 'selectUndeployedSafes').mockReturnValue(undeployed)

    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.queryByTestId('safe-item-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('owned-safes-empty')).toHaveTextContent('No owned Safe accounts yet')
  })

  it('filters the list by the search query', () => {
    mockAllOwned = { '1': ['0xAaa', '0xBbb'] }

    render(<OwnedSafesModal open onClose={noop} />)

    fireEvent.change(screen.getByTestId('owned-safes-search-input'), { target: { value: '0xaaa' } })

    const cards = screen.getAllByTestId('safe-item-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveAttribute('data-address', '0xAaa')
  })

  it('shows the empty state when wallet is connected but no owned Safes', () => {
    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByTestId('owned-safes-empty')).toHaveTextContent('No owned Safe accounts yet')
  })

  it('shows the loading skeleton while the owners query is loading and no data yet', () => {
    mockOwnedLoading = true
    mockAllOwned = {}

    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByTestId('safe-list-skeleton')).toBeInTheDocument()
  })

  it('shows the error message when the owners query fails and there is no data', () => {
    mockOwnedError = new Error('boom')
    mockAllOwned = {}

    render(<OwnedSafesModal open onClose={noop} />)

    expect(screen.getByText('Failed to load owned safes.')).toBeInTheDocument()
  })

  it('tracks ADD_TO_WATCHLIST with the owned_safes_modal label when "Add existing" is clicked', () => {
    render(<OwnedSafesModal open onClose={noop} />)

    fireEvent.click(screen.getByTestId('owned-safes-add-existing'))

    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'owned_safes_modal' }))
  })

  it('tracks CREATE_NEW_SAFE with the owned_safes_modal label when "Create new" is clicked', () => {
    render(<OwnedSafesModal open onClose={noop} />)

    fireEvent.click(screen.getByTestId('owned-safes-create-new'))

    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'owned_safes_modal' }))
  })
})
