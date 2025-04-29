import { render } from '@/tests/test-utils'
import { HexEncodedData } from '.'

const hexData = '0xed2ad31ed00088fc64d00c49774b2fe3fb7fd7db1c2a714700892607b9f77dc1'

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
})
