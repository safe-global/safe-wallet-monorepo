import { renderHook } from '@/tests/test-utils'
import { useSafeNameLookup } from '../useSafeNameLookup'

const renderWithBooks = (addressBook: Record<string, Record<string, string>>) =>
  renderHook(() => useSafeNameLookup(), {
    initialReduxState: { addressBook },
  })

describe('useSafeNameLookup', () => {
  it('returns an empty map when the address book is empty', () => {
    const { result } = renderWithBooks({})
    expect(result.current.size).toBe(0)
  })

  it('lower-cases the address when used as the map key', () => {
    const mixedCase = '0xAaBbCcDdEeFf00112233445566778899AaBbCcDd'
    const { result } = renderWithBooks({ '1': { [mixedCase]: 'Alice' } })
    expect(result.current.get(mixedCase.toLowerCase())).toBe('Alice')
    expect(result.current.get(mixedCase)).toBeUndefined()
  })

  it('flattens entries across all chains', () => {
    const addr1 = '0x1111111111111111111111111111111111111111'
    const addr2 = '0x2222222222222222222222222222222222222222'
    const { result } = renderWithBooks({
      '1': { [addr1]: 'Mainnet Safe' },
      '137': { [addr2]: 'Polygon Safe' },
    })
    expect(result.current.get(addr1)).toBe('Mainnet Safe')
    expect(result.current.get(addr2)).toBe('Polygon Safe')
  })

  it('keeps the first chain encountered when the same address has different names', () => {
    const addr = '0x3333333333333333333333333333333333333333'
    const { result } = renderWithBooks({
      '1': { [addr]: 'Mainnet Name' },
      '137': { [addr]: 'Polygon Name' },
    })
    expect(result.current.get(addr)).toBe('Mainnet Name')
  })

  it('skips entries with empty or whitespace-only names', () => {
    const addr = '0x4444444444444444444444444444444444444444'
    const { result } = renderWithBooks({ '1': { [addr]: '   ' } })
    expect(result.current.has(addr)).toBe(false)
  })
})
