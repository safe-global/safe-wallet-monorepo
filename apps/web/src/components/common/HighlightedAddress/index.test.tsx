import { render } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import HighlightedAddress from '.'

const address = '0x1234567890123456789012345678901234567890'

describe('HighlightedAddress', () => {
  it('renders the full address with the first and last 4 digits in bold', () => {
    const { container } = render(<HighlightedAddress address={address} />)

    expect(container).toHaveTextContent(address)

    const boldParts = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(boldParts).toEqual(['1234', '7890'])
  })

  it('renders the shortened address with the first and last 4 digits in bold', () => {
    const { container } = render(<HighlightedAddress address={address} shorten />)

    expect(container).toHaveTextContent(shortenAddress(address))

    const boldParts = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(boldParts).toEqual(['1234', '7890'])
  })
})
