import { render, screen } from '@/tests/test-utils'
import AccountItemChainBadge from '../AccountItemChainBadge'
import type { SafeItem } from '@/hooks/safes'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
jest.mock('@/features/multichain', () => ({
  NetworkLogosList: () => <span data-testid="network-logos" />,
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = ({ chainId }: { chainId: string }) => (
    <span data-testid="chain-indicator" data-chain-id={chainId} />
  )
  return ChainIndicator
})

const createSafeItem = (chainId: string): SafeItem => ({
  address: '0x1234567890123456789012345678901234567890',
  chainId,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('AccountItemChainBadge', () => {
  it('renders one ChainIndicator per safe in the multichain tooltip without the heading', () => {
    const safes = [createSafeItem('1'), createSafeItem('137'), createSafeItem('10')]

    render(<AccountItemChainBadge safes={safes} />)

    expect(screen.queryByText('Multichain account on:')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('chain-indicator')).toHaveLength(3)
  })

  it('renders a single ChainIndicator without the heading in single-chain mode', () => {
    render(<AccountItemChainBadge chainId="1" />)

    expect(screen.queryByText('Multichain account on:')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('chain-indicator')).toHaveLength(1)
  })
})
