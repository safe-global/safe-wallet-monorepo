import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultiChainSafeItemRow from '../MultiChainSafeItemRow'
import type { SafeItemData, SafeItemDataChain } from '../../types'

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => 'Test Safe',
}))

jest.mock('../SafeInfoDisplay', () => {
  const Mock = ({ nameAction }: { nameAction?: React.ReactNode }) => (
    <div data-testid="safe-info-display">{nameAction}</div>
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

describe('MultiChainSafeItemRow rename pencil', () => {
  it('shows no pencil when canRename is false', () => {
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} canRename={false} onRename={jest.fn()} />)

    expect(screen.queryByTestId('rename-safe-btn')).not.toBeInTheDocument()
  })

  it('calls onRename with all chainIds for a multi-chain safe', () => {
    const onRename = jest.fn()
    render(<MultiChainSafeItemRow item={createItem(['1', '137'])} canRename onRename={onRename} />)

    fireEvent.click(screen.getByTestId('rename-safe-btn'))

    expect(onRename).toHaveBeenCalledWith({
      address: '0xaaa',
      chainIds: ['1', '137'],
      currentName: 'Test Safe',
    })
  })
})
