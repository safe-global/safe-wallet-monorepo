import { render, screen, fireEvent } from '@/tests/test-utils'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import MultiAccountItem from '../MultiAccountItem'
import { useMultiAccountItemData } from '../../../../../hooks/useMultiAccountItemData'
import { useSafeItemData } from '../../../../../hooks/useSafeItemData'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('../../../../../hooks/useMultiAccountItemData')
jest.mock('../../../../../hooks/useSafeItemData')

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="identicon">{address}</div>,
}))

jest.mock('@/features/spaces/components/SelectSafesOnboarding/components/FiatBalance', () => ({
  __esModule: true,
  default: ({ value }: { value?: string }) => <div data-testid="fiat-balance">{value ?? ''}</div>,
}))

jest.mock('@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu', () => ({
  __esModule: true,
  default: ({ name, address }: { name: string; address: string }) => (
    <div data-testid="multi-account-context-menu" data-name={name} data-address={address} />
  ),
}))

jest.mock('@/features/myAccounts/components/AddNetworkButton', () => ({
  AddNetworkButton: ({
    currentName,
    safeAddress,
    deployedChains,
  }: {
    currentName: string
    safeAddress: string
    deployedChains: string[]
  }) => (
    <div
      data-testid="add-network-button"
      data-name={currentName}
      data-address={safeAddress}
      data-chains={deployedChains.join(',')}
    />
  ),
}))

jest.mock('@/features/myAccounts/components/AccountItem', () => ({
  AccountItem: {
    Icon: ({ address, chainId }: { address: string; chainId: string }) => (
      <div data-testid="sub-icon" data-address={address} data-chain={chainId} />
    ),
    ChainBadge: ({ safes }: { safes: Array<{ chainId: string }> }) => (
      <div data-testid="chain-badge" data-chain-count={safes.length} />
    ),
    PinButton: () => <div data-testid="pin-button" />,
    StatusChip: () => <div data-testid="status-chip" />,
    QueueActions: ({ queued, awaitingConfirmation }: { queued: number; awaitingConfirmation: number }) => (
      <div data-testid="queue-actions" data-queued={queued} data-awaiting={awaitingConfirmation} />
    ),
  },
}))

const mockedUseMultiAccountItemData = useMultiAccountItemData as jest.MockedFunction<typeof useMultiAccountItemData>
const mockedUseSafeItemData = useSafeItemData as jest.MockedFunction<typeof useSafeItemData>

const buildSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0x0000000000000000000000000000000000000001',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: '',
  ...overrides,
})

const buildMultiChainSafeItem = (overrides: Partial<MultiChainSafeItem> = {}): MultiChainSafeItem => ({
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Group Name',
  isPinned: false,
  lastVisited: 0,
  safes: [buildSafeItem({ chainId: '1' }), buildSafeItem({ chainId: '137' })],
  ...overrides,
})

type MultiAccountHookReturn = ReturnType<typeof useMultiAccountItemData>
type SafeItemHookReturn = ReturnType<typeof useSafeItemData>

const buildMultiAccountHookReturn = (overrides: Partial<MultiAccountHookReturn> = {}): MultiAccountHookReturn => {
  const safes = [buildSafeItem({ chainId: '1' }), buildSafeItem({ chainId: '137' })]
  return {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Group Name',
    sortedSafes: safes,
    safeOverviews: undefined,
    sharedSetup: undefined,
    totalFiatValue: 100,
    hasReplayableSafe: false,
    isPinned: false,
    isCurrentSafe: false,
    isReadOnly: false,
    isWelcomePage: false,
    deployedChainIds: safes.map((s) => s.chainId),
    isSpaceRoute: false,
    ...overrides,
  } as MultiAccountHookReturn
}

const buildSafeItemHookReturn = (overrides: Partial<SafeItemHookReturn> = {}): SafeItemHookReturn =>
  ({
    chain: undefined,
    name: undefined,
    href: '/home?safe=eth:0x0000000000000000000000000000000000000001',
    safeOverview: undefined,
    isCurrentSafe: false,
    isActivating: false,
    isReplayable: false,
    isWelcomePage: false,
    threshold: 1,
    owners: [{ value: '0xowner1' }],
    undeployedSafe: undefined,
    counterfactualSetup: undefined,
    elementRef: { current: null },
    isVisible: true,
    trackingLabel: OVERVIEW_LABELS.sidebar,
    ...overrides,
  }) as SafeItemHookReturn

describe('MultiAccountItem (MyAccountsV2)', () => {
  const writeText = jest.fn()

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn())
    mockedUseSafeItemData.mockReturnValue(buildSafeItemHookReturn())
  })

  describe('copy address', () => {
    it('renders a copy address button in the group header', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: false }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
    })

    it('copies the group address without toggling expansion', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ address, isCurrentSafe: false }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem({ address })} />)

      fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

      expect(writeText).toHaveBeenCalledWith(address)
      // Clicking copy must not expand the collapsible
      expect(screen.queryByTestId('subacounts-container')).not.toBeInTheDocument()
    })
  })

  describe('display name', () => {
    it('displays the name from multiSafeAccountItem when provided', () => {
      const item = buildMultiChainSafeItem({ name: 'My Explicit Name' })

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      expect(screen.getByText('My Explicit Name')).toBeInTheDocument()
    })

    it('falls back to the hook-derived name when multiSafeAccountItem.name is empty', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ name: 'Hook Name' }))
      const item = buildMultiChainSafeItem({ name: undefined })

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      expect(screen.getByText('Hook Name')).toBeInTheDocument()
    })

    it('falls back to shortened address when no name is available', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ address, name: undefined }))
      const item = buildMultiChainSafeItem({ address, name: undefined })

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      // Shortened form appears both in the display name and in the address row
      expect(screen.getAllByText('0x1234...5678').length).toBeGreaterThanOrEqual(1)
    })

    it('always displays the shortened address below the name', () => {
      const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ address, name: 'Some Name' }))
      const item = buildMultiChainSafeItem({ address, name: 'Some Name' })

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      expect(screen.getByText('0xabcd...abcd')).toBeInTheDocument()
    })
  })

  describe('expansion state', () => {
    it('starts collapsed when the group is not the current safe', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: false }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.queryByTestId('subacounts-container')).not.toBeInTheDocument()
    })

    it('starts expanded when the group is the current safe', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.getByTestId('subacounts-container')).toBeInTheDocument()
    })

    it('expands when the summary is clicked', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: false }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      fireEvent.click(screen.getByTestId('multichain-item-summary'))

      expect(screen.getByTestId('subacounts-container')).toBeInTheDocument()
    })

    it('collapses when the summary is clicked while expanded', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.getByTestId('subacounts-container')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('multichain-item-summary'))
      expect(screen.queryByTestId('subacounts-container')).not.toBeInTheDocument()
    })
  })

  describe('analytics tracking', () => {
    it('fires EXPAND_MULTI_SAFE with sidebar label when expanding outside the welcome page', () => {
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({ isCurrentSafe: false, isWelcomePage: false, isSpaceRoute: false }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      fireEvent.click(screen.getByTestId('multichain-item-summary'))

      expect(trackEvent).toHaveBeenCalledWith({
        ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE,
        label: OVERVIEW_LABELS.sidebar,
      })
    })

    it('fires EXPAND_MULTI_SAFE with login_page label on the welcome accounts page', () => {
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({ isCurrentSafe: false, isWelcomePage: true, isSpaceRoute: false }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      fireEvent.click(screen.getByTestId('multichain-item-summary'))

      expect(trackEvent).toHaveBeenCalledWith({
        ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE,
        label: OVERVIEW_LABELS.login_page,
      })
    })

    it('does not fire an expand event when collapsing', () => {
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ isCurrentSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      fireEvent.click(screen.getByTestId('multichain-item-summary'))

      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: OVERVIEW_EVENTS.EXPAND_MULTI_SAFE.action }),
      )
    })

    it('does not fire an expand event on a space route', () => {
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({ isCurrentSafe: false, isSpaceRoute: true }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      fireEvent.click(screen.getByTestId('multichain-item-summary'))

      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: OVERVIEW_EVENTS.EXPAND_MULTI_SAFE.action }),
      )
    })
  })

  describe('space-safe mode', () => {
    it('hides the pin button and context menu when isSpaceSafe is true', () => {
      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} isSpaceSafe />)

      expect(screen.queryByTestId('pin-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('multi-account-context-menu')).not.toBeInTheDocument()
    })

    it('shows the pin button and context menu when isSpaceSafe is false', () => {
      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} isSpaceSafe={false} />)

      expect(screen.getByTestId('pin-button')).toBeInTheDocument()
      expect(screen.getByTestId('multi-account-context-menu')).toBeInTheDocument()
    })

    it('passes the name and address through to the context menu', () => {
      const item = buildMultiChainSafeItem({
        address: '0xaaa1111111111111111111111111111111111aaa',
        name: 'Context Menu Name',
      })
      mockedUseMultiAccountItemData.mockReturnValue(buildMultiAccountHookReturn({ address: item.address }))

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      const menu = screen.getByTestId('multi-account-context-menu')
      expect(menu).toHaveAttribute('data-name', 'Context Menu Name')
      expect(menu).toHaveAttribute('data-address', item.address)
    })
  })

  describe('sub-items', () => {
    it('renders one sub-item per safe in sortedSafes', () => {
      const safes = [
        buildSafeItem({ chainId: '1', address: '0xaaa' }),
        buildSafeItem({ chainId: '137', address: '0xaaa' }),
        buildSafeItem({ chainId: '10', address: '0xaaa' }),
      ]
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({ sortedSafes: safes, isCurrentSafe: true }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem({ safes })} />)

      expect(screen.getAllByTestId('sub-icon')).toHaveLength(3)
    })

    it('matches a sub-item with its matching overview by chainId and address', () => {
      const safe = buildSafeItem({ chainId: '1', address: '0xaaa' })
      const overview = {
        address: { value: '0xaaa' },
        chainId: '1',
        fiatTotal: '500',
        queued: 2,
        awaitingConfirmation: 1,
      } as unknown as SafeOverview
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({
          sortedSafes: [safe],
          safeOverviews: [overview],
          isCurrentSafe: true,
        }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem({ safes: [safe] })} />)

      expect(mockedUseSafeItemData).toHaveBeenCalledWith(safe, { safeOverview: overview })
    })

    it('does not attach an overview when no match is found', () => {
      const safe = buildSafeItem({ chainId: '1', address: '0xaaa' })
      mockedUseMultiAccountItemData.mockReturnValue(
        buildMultiAccountHookReturn({
          sortedSafes: [safe],
          safeOverviews: [
            {
              address: { value: '0xbbb' },
              chainId: '1',
              fiatTotal: '500',
            } as unknown as SafeOverview,
          ],
          isCurrentSafe: true,
        }),
      )

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem({ safes: [safe] })} />)

      expect(mockedUseSafeItemData).toHaveBeenCalledWith(safe, { safeOverview: undefined })
    })
  })

  describe('AddNetworkButton', () => {
    const expandedMulti = (overrides: Partial<MultiAccountHookReturn> = {}) =>
      buildMultiAccountHookReturn({ isCurrentSafe: true, ...overrides })

    it('renders when the user can add a network (not read-only, has replayable safe, not a space safe)', () => {
      mockedUseMultiAccountItemData.mockReturnValue(expandedMulti({ isReadOnly: false, hasReplayableSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.getByTestId('add-network-button')).toBeInTheDocument()
    })

    it('does not render when the group is read-only', () => {
      mockedUseMultiAccountItemData.mockReturnValue(expandedMulti({ isReadOnly: true, hasReplayableSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.queryByTestId('add-network-button')).not.toBeInTheDocument()
    })

    it('does not render when there is no replayable safe', () => {
      mockedUseMultiAccountItemData.mockReturnValue(expandedMulti({ isReadOnly: false, hasReplayableSafe: false }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} />)

      expect(screen.queryByTestId('add-network-button')).not.toBeInTheDocument()
    })

    it('does not render in space-safe mode', () => {
      mockedUseMultiAccountItemData.mockReturnValue(expandedMulti({ isReadOnly: false, hasReplayableSafe: true }))

      render(<MultiAccountItem multiSafeAccountItem={buildMultiChainSafeItem()} isSpaceSafe />)

      expect(screen.queryByTestId('add-network-button')).not.toBeInTheDocument()
    })

    it('passes current name, address and deployed chain ids to AddNetworkButton', () => {
      const safes = [
        buildSafeItem({ chainId: '1', address: '0xaaa' }),
        buildSafeItem({ chainId: '137', address: '0xaaa' }),
      ]
      const item = buildMultiChainSafeItem({
        address: '0xaaa',
        name: 'Shared Name',
        safes,
      })
      mockedUseMultiAccountItemData.mockReturnValue(
        expandedMulti({
          address: '0xaaa',
          sortedSafes: safes,
          isReadOnly: false,
          hasReplayableSafe: true,
        }),
      )

      render(<MultiAccountItem multiSafeAccountItem={item} />)

      const button = screen.getByTestId('add-network-button')
      expect(button).toHaveAttribute('data-name', 'Shared Name')
      expect(button).toHaveAttribute('data-address', '0xaaa')
      expect(button).toHaveAttribute('data-chains', '1,137')
    })
  })
})
