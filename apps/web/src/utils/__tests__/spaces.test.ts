import { parseSpaceId } from '../spaces'

describe('parseSpaceId', () => {
  it('returns null for null input', () => {
    expect(parseSpaceId(null)).toBe(null)
  })

  it('returns null for empty or whitespace-only strings', () => {
    expect(parseSpaceId('')).toBe(null)
    expect(parseSpaceId('   ')).toBe(null)
  })

  it('passes a UUID string through unchanged', () => {
    expect(parseSpaceId('11111111-1111-1111-1111-111111111111')).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('passes a legacy numeric string through unchanged', () => {
    expect(parseSpaceId('42')).toBe('42')
  })
})
