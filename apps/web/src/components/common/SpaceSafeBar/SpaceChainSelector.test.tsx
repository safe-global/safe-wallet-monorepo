import { render, screen } from '@testing-library/react'
import SpaceChainSelector from './SpaceChainSelector'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'

jest.mock('./hooks/useSpaceChainSelector')
jest.mock(
  '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock',
  () =>
    function ChainSelectorBlock({
      hasMultipleChains,
      selectedChainId,
    }: {
      hasMultipleChains: boolean
      selectedChainId: string
    }) {
      return (
        <div
          data-testid="chain-selector-block"
          data-has-multiple-chains={String(hasMultipleChains)}
          data-selected-chain-id={selectedChainId}
        />
      )
    },
)

const mockUseSpaceChainSelector = useSpaceChainSelector as jest.Mock

const singleChain = [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }]
const multiChain = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
]

describe('SpaceChainSelector', () => {
  beforeEach(() => {
    mockUseSpaceChainSelector.mockReturnValue({
      chains: singleChain,
      selectedChainId: '1',
      hasMultipleChains: false,
      handleChainChange: jest.fn(),
    })
  })

  it('renders null when chains is empty', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      chains: [],
      selectedChainId: '1',
      hasMultipleChains: false,
      handleChainChange: jest.fn(),
    })

    const { container } = render(<SpaceChainSelector />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders ChainSelectorBlock when chains are present', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toBeInTheDocument()
  })

  it('passes hasMultipleChains=false for a single-chain safe', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-has-multiple-chains', 'false')
  })

  it('passes hasMultipleChains=true for a multi-chain safe', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      chains: multiChain,
      selectedChainId: '1',
      hasMultipleChains: true,
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-has-multiple-chains', 'true')
  })

  it('passes selectedChainId to ChainSelectorBlock', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      chains: multiChain,
      selectedChainId: '137',
      hasMultipleChains: true,
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-selected-chain-id', '137')
  })
})
