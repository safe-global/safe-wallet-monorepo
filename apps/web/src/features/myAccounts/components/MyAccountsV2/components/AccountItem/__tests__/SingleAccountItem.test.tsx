import { render, screen, fireEvent, mockClipboard } from '@/tests/test-utils'
import { OVERVIEW_LABELS } from '@/services/analytics'
import type { SafeItem } from '@/hooks/safes'
import SingleAccountItem from '../SingleAccountItem'
import { useSafeItemData } from '../../../../../hooks/useSafeItemData'

jest.mock('../../../../../hooks/useSafeItemData')

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="identicon">{address}</div>,
}))

jest.mock('@/features/spaces', () => ({
  FiatBalance: ({ value }: { value?: string }) => <div data-testid="fiat-balance">{value ?? ''}</div>,
}))

jest.mock('@/features/myAccounts/components/AccountItem', () => ({
  AccountItem: {
    StatusChip: () => <div data-testid="status-chip" />,
    QueueActions: () => <div data-testid="queue-actions" />,
    ChainBadge: () => <div data-testid="chain-badge" />,
    PinButton: () => <div data-testid="pin-button" />,
    ContextMenu: () => <div data-testid="context-menu" />,
  },
}))

const mockedUseSafeItemData = useSafeItemData as jest.MockedFunction<typeof useSafeItemData>
type SafeItemHookReturn = ReturnType<typeof useSafeItemData>

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const buildSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: ADDRESS,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: '',
  ...overrides,
})

const buildHookReturn = (overrides: Partial<SafeItemHookReturn> = {}): SafeItemHookReturn =>
  ({
    chain: undefined,
    name: 'My Safe',
    href: `/home?safe=eth:${ADDRESS}`,
    safeOverview: undefined,
    isCurrentSafe: false,
    isActivating: false,
    isReplayable: false,
    threshold: 1,
    owners: [{ value: '0xowner' }],
    undeployedSafe: undefined,
    elementRef: { current: null },
    trackingLabel: OVERVIEW_LABELS.login_page,
    ...overrides,
  }) as SafeItemHookReturn

describe('SingleAccountItem (MyAccountsV2)', () => {
  let writeText: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    writeText = mockClipboard()
    mockedUseSafeItemData.mockReturnValue(buildHookReturn())
  })

  it('renders the name and shortened address', () => {
    render(<SingleAccountItem safeItem={buildSafeItem()} />)

    expect(screen.getByText('My Safe')).toBeInTheDocument()
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
  })

  it('renders a copy-address button next to the address', () => {
    render(<SingleAccountItem safeItem={buildSafeItem()} />)

    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
  })

  it('copies the address when the copy button is clicked', () => {
    render(<SingleAccountItem safeItem={buildSafeItem()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })
})
