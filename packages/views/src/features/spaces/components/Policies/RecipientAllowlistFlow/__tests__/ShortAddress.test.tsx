import { render } from '@testing-library/react'
import ShortAddress from '../ShortAddress'

describe('ShortAddress', () => {
  it('shows the first and last characters around an ellipsis', () => {
    const { container } = render(<ShortAddress address="0x1234567890abcdef1234567890abcdef12345678" />)

    expect(container).toHaveTextContent('0x1234...5678')
  })

  it('renders nothing without an address', () => {
    const { container } = render(<ShortAddress address="" />)

    expect(container).toBeEmptyDOMElement()
  })
})
