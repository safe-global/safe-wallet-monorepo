import { parseSpaceId } from '../spaces'

describe('parseSpaceId', () => {
  it('returns null for null input', () => {
    expect(parseSpaceId(null)).toBe(null)
  })

  it('parses a numeric string to a number', () => {
    expect(parseSpaceId('42')).toBe(42)
    expect(parseSpaceId('0')).toBe(0)
  })

  it('returns null for non-numeric strings', () => {
    expect(parseSpaceId('abc')).toBe(null)
    expect(parseSpaceId('')).toBe(null)
    expect(parseSpaceId('42abc')).toBe(null)
  })

  it('returns null for special numeric values that JS coerces to non-finite', () => {
    expect(parseSpaceId('Infinity')).toBe(null)
    expect(parseSpaceId('NaN')).toBe(null)
  })
})
