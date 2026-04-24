import { render, screen } from '@testing-library/react'
import SpaceChainSelector from './SpaceChainSelector'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import type { ChainSelectorBlockProps } from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'

jest.mock('./hooks/useSpaceChainSelector')
jest.mock(
  '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock',
  () =>
    function ChainSelectorBlock({
      deployedChains,
      selectedChainId,
      safeAddress,
      deployedChainIds,
    }: ChainSelectorBlockProps) {
      return (
        <div
          data-testid="chain-selector-block"
          data-deployed-count={String(deployedChains.length)}
          data-selected-chain-id={selectedChainId}
          data-safe-address={safeAddress}
          data-deployed-chain-ids={deployedChainIds.join(',')}
        />
      )
    },
)
jest.mock('@/features/multichain', () => ({
  CreateSafeOnNewChain: () => <div data-testid="create-safe-on-new-chain" />,
}))

const mockUseSpaceChainSelector = useSpaceChainSelector as jest.Mock

const singleChain = [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }]
const multiChain = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
]

describe('SpaceChainSelector', () => {
  beforeEach(() => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: singleChain,
      selectedChainId: '1',
      deployedChainIds: ['1'],
      safeAddress: '0xSafe1',
      safeName: 'My Safe',
      handleChainChange: jest.fn(),
    })
  })

  it('renders null when deployedChains is empty', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: [],
      selectedChainId: '1',
      deployedChainIds: [],
      safeAddress: '0xSafe1',
      safeName: undefined,
      handleChainChange: jest.fn(),
    })

    const { container } = render(<SpaceChainSelector />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders ChainSelectorBlock when deployed chains are present', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('space-chain-selector')).toBeInTheDocument()
    expect(screen.getByTestId('chain-selector-block')).toBeInTheDocument()
  })

  it('passes deployed chain count to ChainSelectorBlock', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-count', '1')
  })

  it('passes correct deployed count for multi-chain safe', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '1',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-count', '2')
  })

  it('passes selectedChainId to ChainSelectorBlock', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '137',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-selected-chain-id', '137')
  })

  it('passes safeAddress and deployedChainIds down to ChainSelectorBlock', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '1',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-safe-address', '0xSafe2')
    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-chain-ids', '1,137')
  })
})
