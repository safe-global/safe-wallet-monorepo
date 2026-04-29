import { render, screen } from '@testing-library/react'
import MultiChainSafeItemRow from '../MultiChainSafeItemRow'
import type { SafeItemData } from '../../types'

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => 'Test Safe',
}))

jest.mock('../SafeInfoDisplay', () => {
  const Mock = () => <div data-testid="safe-info-display" />
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

const makeChain = (chainId: string) => ({
  chainId,
  chainName: `Chain ${chainId}`,
  chainLogoUri: null,
  shortName: `c${chainId}`,
})

const createItem = (chainIds: string[], overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: `1:0xaaa`,
  name: 'Test Safe',
  address: '0xaaa',
  threshold: 1,
  owners: 2,
  balance: '0',
  chains: chainIds.map(makeChain),
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
