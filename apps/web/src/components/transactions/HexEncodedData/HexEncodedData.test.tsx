import { fireEvent, render, screen } from '@/tests/test-utils'
import { HexEncodedData } from '.'

const hexData = '0xed2ad31ed00088fc64d00c49774b2fe3fb7fd7db1c2a714700892607b9f77dc1'

const longHexData =
  '0xb460af94123400000000000000000000000000000000000000000000000000000000000186a00000000000000000000000009a1148b5d6a2d34ca46111379d0fd1352a0ade4a0000000000000000000000009a1148b5d6a2d34ca46111379d0fd1352a0ade4a'

describe('HexEncodedData', () => {
  it('should render the default component markup', () => {
    const result = render(<HexEncodedData hexData={hexData} title="Data (hex-encoded)" />)
    const showMoreButton = result.getByTestId('show-more')
    const tooltipComponent = result.getByLabelText(
      'The first 4 bytes determine the contract method that is being called',
    )
    expect(showMoreButton).toBeInTheDocument()
    expect(showMoreButton).toHaveTextContent('Show more')
    expect(tooltipComponent).toBeInTheDocument()

    expect(result.container).toMatchSnapshot()
  })

  it('should not highlight the data if highlight option is false', () => {
    const result = render(
      <HexEncodedData hexData="0x102384763718984309876" highlightFirstBytes={false} title="Some arbitrary data" />,
    )

    expect(result.container.querySelector('b')).not.toBeInTheDocument()
    expect(result.container).toMatchSnapshot()
  })

  it('should not cut the text in case the limit option is higher than the provided hexData', () => {
    const result = render(<HexEncodedData hexData={hexData} limit={1000} title="Data (hex-encoded)" />)

    expect(result.container.querySelector("button[data-testid='show-more']")).not.toBeInTheDocument()

    expect(result.container).toMatchSnapshot()
  })

  it('should show the full data when expanded', () => {
    render(<HexEncodedData hexData={longHexData} limit={20} title="Data (hex-encoded)" />)

    // Initially should show shortened data
    const initialData = screen.getByTestId('tx-hexData')
    expect(initialData).toHaveTextContent(`${longHexData.slice(0, 20)}… Show more`)

    // Click show more
    const showMoreButton = screen.getByTestId('show-more')
    fireEvent.click(showMoreButton)

    // Should now show full data
    expect(initialData).toHaveTextContent(longHexData)

    // Check that we have tree blocks of dimmed zeroes
    const zeroesBlocks = initialData.querySelectorAll('span.zeroes')
    expect(zeroesBlocks).toHaveLength(3)
    expect(zeroesBlocks[0].textContent).toHaveLength(59)
    expect(zeroesBlocks[1].textContent).toHaveLength(25)
    expect(zeroesBlocks[2].textContent).toHaveLength(24)
    // Show less button should be visible
    expect(showMoreButton).toHaveTextContent('Show less')

    // Click show less
    fireEvent.click(showMoreButton)

    // Should be back to shortened data
    expect(initialData).toHaveTextContent(`${longHexData.slice(0, 20)}… Show more`)
    expect(showMoreButton).toHaveTextContent('Show more')
  })
})
