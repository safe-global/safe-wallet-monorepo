import { render, screen } from '@testing-library/react'
import SafeItem from '../SafeItem'
import type { SafeItemData, SafeItemDataChain } from '../../types'

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

const makeChain = (overrides: Partial<SafeItemDataChain> = {}): SafeItemDataChain => ({
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: null,
  shortName: 'eth',
  ...overrides,
})

const createItem = (chain: SafeItemDataChain): SafeItemData => ({
  id: '1:0xaaa',
  name: 'Test Safe',
  address: '0xaaa',
  threshold: 1,
  owners: 2,
  balance: '0',
  chains: [chain],
})

describe('SafeItem undeployed state', () => {
  it('renders the Not activated badge instead of the balance for an undeployed chain', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true }))} />)

    expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
    expect(screen.queryByTestId('balance-display')).not.toBeInTheDocument()
  })

  it('renders the Activating label for an activating chain', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true, isActivating: true }))} />)

    expect(screen.getByLabelText('Activating')).toBeInTheDocument()
  })

  it('renders the balance for a deployed chain', () => {
    render(<SafeItem {...createItem(makeChain())} />)

    expect(screen.getByTestId('balance-display')).toBeInTheDocument()
    expect(screen.queryByTestId('not-activated-badge')).not.toBeInTheDocument()
  })

  it('renders the activation status in the shared row-end column (same trailing slot as the balance)', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true }))} />)

    expect(screen.getByTestId('row-end-column')).toContainElement(screen.getByTestId('not-activated-badge'))
  })
})
