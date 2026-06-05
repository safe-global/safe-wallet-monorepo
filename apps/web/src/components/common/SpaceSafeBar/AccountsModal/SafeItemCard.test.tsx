import { render, screen } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import SafeItemCard from './SafeItemCard'

const defaultSafeItemData = {
  name: undefined,
  safeOverview: { fiatTotal: 0 } as { fiatTotal: number } | undefined,
  threshold: 1,
  owners: [{ value: '0x0000000000000000000000000000000000000001' }],
  elementRef: { current: null },
  undeployedSafe: undefined as { status: { status: string } } | undefined,
  isActivating: false,
  href: { pathname: '/home', query: { safe: 'eth:0x0000000000000000000000000000000000000000' } },
}

let mockSafeItemData = { ...defaultSafeItemData }

jest.mock('@/features/myAccounts', () => ({
  useSafeItemData: () => mockSafeItemData,
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: () => undefined,
}))

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => undefined,
}))

jest.mock('./PinnedSafeContextMenu', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('SafeItemCard', () => {
  const noopClose = jest.fn()

  beforeEach(() => {
    mockSafeItemData = { ...defaultSafeItemData }
  })

  it('hides read-only badge when high similarity is shown', () => {
    const safeItem = safeItemBuilder()
      .with({
        address: '0x1234567890123456789012345678901234567890',
        isReadOnly: true,
      })
      .build()

    render(<SafeItemCard safeItem={safeItem} isSimilar onClose={noopClose} />)

    expect(screen.getByText('High similarity')).toBeInTheDocument()
    expect(screen.queryByText('Read-only')).not.toBeInTheDocument()
  })

  it('shows read-only badge when safe is read-only and not flagged as similar', () => {
    const safeItem = safeItemBuilder()
      .with({
        isReadOnly: true,
      })
      .build()

    render(<SafeItemCard safeItem={safeItem} onClose={noopClose} />)

    expect(screen.queryByText('High similarity')).not.toBeInTheDocument()
    expect(screen.getByText('Read-only')).toBeInTheDocument()
  })

  it('renders the pin/unpin button by default', () => {
    const safeItem = safeItemBuilder().build()

    render(<SafeItemCard safeItem={safeItem} onClose={noopClose} />)

    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
  })

  it('hides the pin/unpin button when hidePinControls is set (space-safe context)', () => {
    const safeItem = safeItemBuilder().build()

    render(<SafeItemCard safeItem={safeItem} onClose={noopClose} hidePinControls />)

    expect(screen.queryByTestId('bookmark-icon')).not.toBeInTheDocument()
  })

  it('renders the full address with bolded first/last 4 hex chars when flagged as similar', () => {
    const safeItem = safeItemBuilder()
      .with({
        address: '0x1234567890123456789012345678901234567890',
      })
      .build()

    const { container } = render(<SafeItemCard safeItem={safeItem} isSimilar onClose={noopClose} />)

    const bolded = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(bolded).toEqual(expect.arrayContaining(['1234', '7890']))
  })
})

describe('SafeItemCard – undeployed', () => {
  const noopClose = jest.fn()

  beforeEach(() => {
    mockSafeItemData = {
      ...defaultSafeItemData,
      safeOverview: undefined,
      undeployedSafe: { status: { status: 'AWAITING_EXECUTION' } },
    }
  })

  it('renders the Not activated badge outside the name column for an undeployed safe', () => {
    const safeItem = safeItemBuilder().with({ address: '0x1234567890123456789012345678901234567890' }).build()

    render(<SafeItemCard safeItem={safeItem} onClose={noopClose} />)

    const badge = screen.getByText('Not activated')
    const nameColumn = screen.getByTestId('name-column')

    expect(nameColumn.contains(badge)).toBe(false)
  })
})
