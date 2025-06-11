import { mockedChains } from '@/src/store/constants'
import { ChainsDisplay } from './ChainsDisplay'
import { render } from '@/src/tests/test-utils'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

describe('ChainsDisplay', () => {
  it('should render all chains next each other', () => {
    const container = render(<ChainsDisplay chains={mockedChains as unknown as Chain[]} max={mockedChains.length} />)

    expect(container.getAllByTestId('chain-display')).toHaveLength(3)
  })
  it('should truncate the chains when the provided chains length is greatter than the max', () => {
    const container = render(<ChainsDisplay chains={mockedChains as unknown as Chain[]} max={2} />)
    const moreChainsBadge = container.getByTestId('more-chains-badge')

    expect(container.getAllByTestId('chain-display')).toHaveLength(2)
    expect(moreChainsBadge).toBeVisible()
    expect(moreChainsBadge).toHaveTextContent('+1')
  })

  it('should always show the selected chain as the first column of the row', () => {
    const container = render(
      <ChainsDisplay chains={mockedChains as unknown as Chain[]} max={2} activeChainId={mockedChains[2].chainId} />,
    )

    expect(container.getByLabelText(mockedChains[2].chainName)).toBeTruthy()
  })
})
