import { toHex } from '../utils'

describe('toHex', () => {
  it('converts numeric chain ids to hex', () => {
    expect(toHex('1')).toBe('0x1')
    expect(toHex('137')).toBe('0x89')
    expect(toHex(11155111)).toBe('0xaa36a7')
  })

  it('normalizes a 0x-hex input to a canonical quantity', () => {
    expect(toHex('0x010')).toBe('0x10')
    expect(toHex('0x0')).toBe('0x0')
  })

  it('preserves precision above 2^53 (BigInt, not Number)', () => {
    // 0x20000000000001 = 2^53 + 1 — Number would round this down to 2^53.
    expect(toHex('0x20000000000001')).toBe('0x20000000000001')
  })
})
