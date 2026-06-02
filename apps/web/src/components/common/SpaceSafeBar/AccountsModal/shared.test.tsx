import { render } from '@testing-library/react'
import { ShortAddressWithTooltip } from './shared'

const ADDRESS = '0xabcd567890123456789012345678901234567890'

describe('ShortAddressWithTooltip', () => {
  it('renders the shortened address as plain text when not flagged as similar', () => {
    const { container } = render(<ShortAddressWithTooltip address={ADDRESS} />)

    expect(container.textContent).toContain('0xabcd...7890')
    expect(container.querySelectorAll('b')).toHaveLength(0)
  })

  it('renders the shortened address with the first 4 and last 4 hex chars bolded when isSimilar is true', () => {
    const { container } = render(<ShortAddressWithTooltip address={ADDRESS} isSimilar />)

    const bolded = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(bolded).toEqual(['abcd', '7890'])
    expect(container.textContent).toContain('0xabcd...7890')
  })
})
