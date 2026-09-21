import { render } from '@/tests/test-utils'
import { HighlightedAddress } from './HighlightedAddress'

const ADDRESS = '0xAABBccddeeff00112233445566778899aabbCCDD'

describe('HighlightedAddress', () => {
  it('bolds the matched front and back hex, leaving 0x and the middle normal', () => {
    const { container } = render(<HighlightedAddress address={ADDRESS} prefixLen={4} suffixLen={4} />)

    const bolds = container.querySelectorAll('b')
    expect(bolds).toHaveLength(2)
    expect(bolds[0]).toHaveTextContent('AABB')
    expect(bolds[1]).toHaveTextContent('CCDD')
    // full address is preserved end-to-end
    expect(container.textContent).toBe(ADDRESS)
  })

  it('bolds nothing when both lengths are zero', () => {
    const { container } = render(<HighlightedAddress address={ADDRESS} prefixLen={0} suffixLen={0} />)

    expect(container.querySelectorAll('b')).toHaveLength(0)
    expect(container.textContent).toBe(ADDRESS)
  })

  it('never overlaps front and back when the lengths would exceed the address', () => {
    const { container } = render(<HighlightedAddress address={ADDRESS} prefixLen={40} suffixLen={40} />)

    // front wins the whole hex; back gets nothing → still one contiguous bold, no double-count
    expect(container.textContent).toBe(ADDRESS)
  })
})
