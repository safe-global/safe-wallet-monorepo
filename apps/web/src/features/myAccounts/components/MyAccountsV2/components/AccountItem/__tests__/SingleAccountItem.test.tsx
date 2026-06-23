import { render, screen } from '@/tests/test-utils'
import type { SafeItem } from '@/hooks/safes'
import SingleAccountItem from '../SingleAccountItem'
import { useSafeItemData } from '../../../../../hooks/useSafeItemData'
import { OVERVIEW_LABELS } from '@/services/analytics'

jest.mock('../../../../../hooks/useSafeItemData')

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="identicon">{address}</div>,
}))

jest.mock('@/features/spaces', () => ({
  __esModule: true,
  FiatBalance: ({ value }: { value?: string }) => <div data-testid="fiat-balance">{value ?? ''}</div>,
}))

jest.mock('@/features/myAccounts/components/AccountItem', () => ({
  AccountItem: {
    ChainBadge: () => <div data-testid="chain-badge" />,
    StatusChip: () => <div data-testid="status-chip" />,
    QueueActions: () => <div data-testid="queue-actions" />,
    PinButton: () => <div data-testid="pin-button" />,
    ContextMenu: () => <div data-testid="context-menu" />,
  },
}))

const mockedUseSafeItemData = useSafeItemData as jest.MockedFunction<typeof useSafeItemData>

type SafeItemHookReturn = ReturnType<typeof useSafeItemData>

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const SHORT_ADDRESS = '0x1234...5678'

const buildSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: ADDRESS,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

const buildSafeItemHookReturn = (overrides: Partial<SafeItemHookReturn> = {}): SafeItemHookReturn =>
  ({
    chain: undefined,
    name: undefined,
    href: `/home?safe=eth:${ADDRESS}`,
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

describe('SingleAccountItem (MyAccountsV2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseSafeItemData.mockReturnValue(buildSafeItemHookReturn())
  })

  it('shows the address only once when the safe has no name', () => {
    render(<SingleAccountItem safeItem={buildSafeItem()} />)

    expect(screen.getAllByText(SHORT_ADDRESS)).toHaveLength(1)
  })

  it('shows the address-book name on top and the address below', () => {
    mockedUseSafeItemData.mockReturnValue(buildSafeItemHookReturn({ name: 'My Safe' }))

    render(<SingleAccountItem safeItem={buildSafeItem()} />)

    expect(screen.getByText('My Safe')).toBeInTheDocument()
    expect(screen.getByText(SHORT_ADDRESS)).toBeInTheDocument()
  })

  it('uses the safe item name for space safes', () => {
    render(<SingleAccountItem safeItem={buildSafeItem({ name: 'Space Safe' })} isSpaceSafe />)

    expect(screen.getByText('Space Safe')).toBeInTheDocument()
    expect(screen.getByText(SHORT_ADDRESS)).toBeInTheDocument()
  })
})
