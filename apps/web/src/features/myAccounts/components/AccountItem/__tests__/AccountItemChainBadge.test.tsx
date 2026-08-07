import { render, screen } from '@/tests/test-utils'
import AccountItemChainBadge from '../AccountItemChainBadge'
import type { SafeItem } from '@/hooks/safes'

jest.mock('@/features/multichain', () => ({
  NetworkLogosTooltip: ({
    networks,
    maxVisible,
    imageSize,
    contentTestId,
  }: {
    networks: { chainId: string }[]
    maxVisible?: number
    imageSize?: number
    contentTestId?: string
  }) => (
    <div data-testid={contentTestId} data-max-visible={maxVisible} data-image-size={imageSize}>
      {networks.map((network) => (
        <span key={network.chainId} data-testid="chain-indicator" data-chain-id={network.chainId} />
      ))}
    </div>
  ),
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = ({ chainId, imageSize }: { chainId: string; imageSize?: number }) => (
    <span data-testid="chain-indicator" data-chain-id={chainId} data-image-size={imageSize} />
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

  it('caps the stack at 3 logos of 22px', () => {
    const safes = [createSafeItem('1'), createSafeItem('137'), createSafeItem('10'), createSafeItem('42161')]

    render(<AccountItemChainBadge safes={safes} />)

    const tooltip = screen.getByTestId('multichain-tooltip')
    expect(tooltip).toHaveAttribute('data-max-visible', '3')
    expect(tooltip).toHaveAttribute('data-image-size', '22')
  })

  it('renders a single ChainIndicator without the heading in single-chain mode', () => {
    render(<AccountItemChainBadge chainId="1" />)

    expect(screen.queryByText('Multichain account on:')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('chain-indicator')).toHaveLength(1)
    expect(screen.getByTestId('chain-indicator')).toHaveAttribute('data-image-size', '22')
  })
})
