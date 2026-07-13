import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useChain } from '@/hooks/useChains'
import MultiChainSafeItemRow from '../MultiChainSafeItemRow'
import type { SafeItemData, SafeItemDataChain } from '../../types'

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => 'Test Safe',
}))

// Per-chain rows resolve their own chain config; default to none so the icon/badge suites stay light.
jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(() => undefined),
}))

// Surface the explorerLink the summary row is (or isn't) given — the multi-chain summary must never
// receive one, since its chain would be arbitrary.
jest.mock('@/components/common/AccountRow/SafeInfoDisplay', () => {
  const Mock = ({ explorerLink }: { explorerLink?: { href: string } }) => (
    <div data-testid="safe-info-display">
      {explorerLink && <a data-testid="summary-explorer-link" href={explorerLink.href} />}
    </div>
  )
  Mock.displayName = 'SafeInfoDisplay'
  return { __esModule: true, default: Mock }
})

jest.mock('../BalanceDisplay', () => {
  const Mock = () => <div data-testid="balance-display" />
  Mock.displayName = 'BalanceDisplay'
  return { __esModule: true, default: Mock }
})

jest.mock('../ChainLogo', () => {
  const Mock = ({ chainId }: { chainId: string }) => <div data-testid={`chain-logo-${chainId}`} />
  Mock.displayName = 'ChainLogo'
  return { __esModule: true, default: Mock }
})

jest.mock('@/components/common/FiatValue', () => {
  const Mock = () => <span />
  Mock.displayName = 'FiatValue'
  return { __esModule: true, default: Mock }
})

jest.mock('@/components/ui/select', () => ({
  SelectItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

const makeChain = (chainId: string, overrides: Partial<SafeItemDataChain> = {}): SafeItemDataChain => ({
  chainId,
  chainName: `Chain ${chainId}`,
  chainLogoUri: null,
  shortName: `c${chainId}`,
  ...overrides,
})

const createItem = (chains: (string | SafeItemDataChain)[], overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: `1:0xaaa`,
  name: 'Test Safe',
  address: '0xaaa',
  threshold: 1,
  owners: 2,
  balance: '0',
  chains: chains.map((chain) => (typeof chain === 'string' ? makeChain(chain) : chain)),
  ...overrides,
})

describe('MultiChainSafeItemRow chain icon overflow badge', () => {
  it('shows no overflow badge when there are exactly 3 chains', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137', '10'])} />)

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-1')).toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-137')).toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-10')).toBeInTheDocument()
  })

  it('shows +1 badge and only 3 chain logos when there are 4 chains', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137', '10', '42161'])} />)

    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-1')).toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-137')).toBeInTheDocument()
    expect(screen.getByTestId('chain-logo-10')).toBeInTheDocument()
  })

  it('shows +3 badge when there are 6 chains', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137', '10', '42161', '8453', '100'])} />)

    expect(screen.getByText('+3')).toBeInTheDocument()
  })
})

describe('MultiChainSafeItemRow summary badges', () => {
  it('renders an icon-only threshold pill (setup can differ per chain)', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'], { threshold: 2, owners: 3 })} />)

    const badge = screen.getByTestId('account-threshold')
    expect(badge).toBeInTheDocument()
    expect(badge).not.toHaveTextContent('2/3')
  })

  it('sums queued transactions across chains into one pending badge', () => {
    render(
      <MultiChainSafeItemRow item={createItem([makeChain('1', { queued: 2 }), makeChain('137', { queued: 1 })])} />,
    )

    expect(screen.getByTestId('account-pending')).toHaveTextContent('3')
  })

  it('keeps the pending column as whitespace when no chain has queued transactions', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} />)

    expect(screen.queryByTestId('account-pending')).not.toBeInTheDocument()
    expect(screen.getByTestId('row-pending-column')).toBeInTheDocument()
  })
})

describe('MultiChainSafeItemRow active-chain behaviour', () => {
  it('expands by default when the group holds the active chain', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} isSelected />)

    // The per-chain rows are visible without the user expanding the group.
    expect(screen.getByText('Chain 1')).toBeInTheDocument()
    expect(screen.getByText('Chain 137')).toBeInTheDocument()
  })

  it('does not highlight the summary row even when it holds the active chain', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} isSelected />)

    // The highlight belongs to the active network row (via the Select value), not the summary trigger.
    const trigger = screen.getByRole('button')
    expect(trigger.className.split(/\s+/)).not.toContain('bg-muted')
  })

  it('stays collapsed when the group does not hold the active chain', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} />)

    expect(screen.queryByText('Chain 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Chain 137')).not.toBeInTheDocument()
  })
})

describe('MultiChainSafeItemRow expanded per-chain rows', () => {
  const expandRow = async () => {
    await userEvent.click(screen.getByRole('button'))
  }

  it('shows each chain name once expanded', async () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} />)
    await expandRow()

    expect(screen.getByText('Chain 1')).toBeInTheDocument()
    expect(screen.getByText('Chain 137')).toBeInTheDocument()
  })

  it('shows a full threshold pill on each chain row (per-chain, not icon-only)', async () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'], { threshold: 2, owners: 3 })} />)
    await expandRow()

    // Collapsed summary badge stays icon-only; the two expanded rows show the full "2/3".
    const fullBadges = screen.getAllByText('2/3')
    expect(fullBadges).toHaveLength(2)
  })

  it('shows per-chain pending counts (not the summed total) on the expanded rows', async () => {
    render(
      <MultiChainSafeItemRow item={createItem([makeChain('1', { queued: 2 }), makeChain('137', { queued: 1 })])} />,
    )
    await expandRow()

    // Summary row (3) + the two per-chain rows (2 and 1).
    const pendingBadges = screen.getAllByTestId('account-pending').map((el) => el.textContent)
    expect(pendingBadges).toEqual(expect.arrayContaining(['3', '2', '1']))
  })

  it('marks a read-only chain row with a Read-only badge', async () => {
    render(<MultiChainSafeItemRow item={createItem([makeChain('1', { isReadOnly: true }), makeChain('137')])} />)
    await expandRow()

    expect(screen.getByText('Read-only')).toBeInTheDocument()
  })
})

describe('MultiChainSafeItemRow undeployed status badge', () => {
  const expandRow = async () => {
    await userEvent.click(screen.getByRole('button'))
  }

  it('shows the Inactive badge for an undeployed chain when other chains are deployed', async () => {
    render(<MultiChainSafeItemRow item={createItem([makeChain('1', { isUndeployed: true }), makeChain('137')])} />)
    await expandRow()

    const badge = screen.getByTestId('not-activated-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-label', 'Inactive')
  })

  it('shows one Inactive badge per undeployed chain in a partially deployed safe', async () => {
    render(
      <MultiChainSafeItemRow
        item={createItem([
          makeChain('1', { isUndeployed: true }),
          makeChain('137'),
          makeChain('10', { isUndeployed: true }),
        ])}
      />,
    )
    await expandRow()

    expect(screen.getAllByTestId('not-activated-badge')).toHaveLength(2)
  })

  it('shows the Activating badge for an activating chain', async () => {
    render(
      <MultiChainSafeItemRow
        item={createItem([makeChain('1', { isUndeployed: true, isActivating: true }), makeChain('137')])}
      />,
    )
    await expandRow()

    expect(screen.getByTestId('not-activated-badge')).toHaveAttribute('aria-label', 'Activating')
  })

  it('shows no status badge when every chain is deployed', async () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} />)
    await expandRow()

    expect(screen.queryByTestId('not-activated-badge')).not.toBeInTheDocument()
  })
})

describe('MultiChainSafeItemRow hover highlight', () => {
  it('takes focus when the summary is hovered so base-ui does not strand the highlight on the previous row', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} />)

    const trigger = screen.getByRole('button')
    expect(trigger).not.toHaveFocus()

    fireEvent.mouseEnter(trigger)

    expect(trigger).toHaveFocus()
  })
})

describe('MultiChainSafeItemRow per-chain explorer links', () => {
  beforeEach(() => {
    jest.mocked(useChain).mockReturnValue({
      blockExplorerUriTemplate: { address: 'https://etherscan.io/address/{{address}}' },
    } as unknown as ReturnType<typeof useChain>)
  })

  afterEach(() => {
    jest.mocked(useChain).mockReturnValue(undefined)
  })

  it('renders a per-chain explorer link on each network row and none on the summary', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} isSelected />)

    // One link per chain — the summary row (stubbed) never receives an explorerLink.
    expect(screen.queryByTestId('summary-explorer-link')).not.toBeInTheDocument()
    const links = screen.getAllByTestId('safe-item-row-explorer-link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', 'https://etherscan.io/address/0xaaa')
  })
})
