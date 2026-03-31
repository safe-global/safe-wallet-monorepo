import { render, screen } from '@/tests/test-utils'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import SafeCardItem from '@/components/common/SafeList/components/SafeCardItem'

// Mock heavy child dependencies
jest.mock('@/components/common/SafeList/components/hooks/useSafeCardData', () => ({
  __esModule: true,
  default: () => ({
    name: 'Test Safe',
    fiatValue: '1000',
    threshold: 2,
    ownersCount: 3,
    chainIds: ['1'],
    elementRef: undefined,
  }),
}))

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid={`identicon-${address}`} />,
}))

jest.mock('@/components/common/SafeList/components/FiatBalance', () => ({
  __esModule: true,
  default: ({ value }: { value: string | number | undefined }) => <span data-testid="fiat-balance">{value}</span>,
}))

jest.mock('@/components/common/SafeList/components/ThresholdBadge', () => ({
  __esModule: true,
  default: ({ threshold, owners }: { threshold: number; owners: number }) => (
    <span data-testid="threshold-badge">
      {threshold}/{owners}
    </span>
  ),
}))

jest.mock('@/features/myAccounts/components/AccountItem', () => ({
  AccountItem: {
    ChainBadge: ({ safes }: { safes: SafeItem[] }) => <span data-testid="chain-badge">{safes.length} chains</span>,
  },
}))

jest.mock('@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu', () => ({
  __esModule: true,
  default: ({ name, address }: { name: string; address: string }) => (
    <div data-testid="context-menu">
      {name} {address}
    </div>
  ),
}))

const buildSafe = (address: string, chainId = '1'): SafeItem =>
  ({ address, chainId, isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined }) as SafeItem

const buildMultiChain = (address: string, chainIds: string[]): MultiChainSafeItem =>
  ({ address, safes: chainIds.map((cid) => buildSafe(address, cid)) }) as MultiChainSafeItem

describe('SafeCardItem', () => {
  it('renders safe name and address', () => {
    render(<SafeCardItem safe={buildSafe('0xabc123')} />)

    expect(screen.getByText('Test Safe')).toBeInTheDocument()
    expect(screen.getByTestId('fiat-balance')).toHaveTextContent('1000')
    expect(screen.getByTestId('threshold-badge')).toHaveTextContent('2/3')
  })

  it('shows shortened address as subtitle', () => {
    const address = '0xabc1234567890def'
    render(<SafeCardItem safe={buildSafe(address)} />)

    expect(screen.getByText('0xabc1...0def')).toBeInTheDocument()
  })

  it('bolds first and last 4 chars of address when isSimilar', () => {
    const address = '0xABCDEF1234567890abcdef'
    const { container } = render(<SafeCardItem safe={buildSafe(address)} isSimilar />)

    const boldElements = container.querySelectorAll('b')
    expect(boldElements).toHaveLength(2)
    expect(boldElements[0].textContent).toBe(address.slice(2, 6))
    expect(boldElements[1].textContent).toBe(address.slice(-4))
  })

  it('does not bold address when not similar', () => {
    const { container } = render(<SafeCardItem safe={buildSafe('0xabc123')} />)

    expect(container.querySelectorAll('b')).toHaveLength(0)
  })

  it('does not show similarity badge when isSimilar is false', () => {
    render(<SafeCardItem safe={buildSafe('0xabc123')} />)

    expect(screen.queryByText('High similarity')).not.toBeInTheDocument()
  })

  it('shows similarity badge when isSimilar is true', () => {
    render(<SafeCardItem safe={buildSafe('0xabc123')} isSimilar />)

    expect(screen.getByText('High similarity')).toBeInTheDocument()
  })

  it('renders context menu for edit/remove actions', () => {
    render(<SafeCardItem safe={buildSafe('0xabc123')} />)

    expect(screen.getByTestId('context-menu')).toBeInTheDocument()
  })

  it('renders multi-chain safe with chain badge', () => {
    render(<SafeCardItem safe={buildMultiChain('0xmulti', ['1', '137'])} />)

    expect(screen.getByTestId('chain-badge')).toHaveTextContent('2 chains')
  })
})
