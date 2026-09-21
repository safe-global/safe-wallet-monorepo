import { normalizeSpaceId } from '../spaces'

describe('normalizeSpaceId', () => {
  it('returns null for null input', () => {
    expect(normalizeSpaceId(null)).toBe(null)
  })

  it('returns null for empty or whitespace-only strings', () => {
    expect(normalizeSpaceId('')).toBe(null)
    expect(normalizeSpaceId('   ')).toBe(null)
  })

  it('passes a UUID string through unchanged', () => {
    expect(normalizeSpaceId('11111111-1111-1111-1111-111111111111')).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('passes a legacy numeric string through unchanged', () => {
    expect(normalizeSpaceId('42')).toBe('42')
  })
})
