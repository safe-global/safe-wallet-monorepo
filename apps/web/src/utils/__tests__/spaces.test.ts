import { addressOfSafeKey, countSeats, isSpaceAtSafeLimit, normalizeSpaceId } from '../spaces'

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

describe('isSpaceAtSafeLimit', () => {
  it('is at the limit once the count reaches the quota', () => {
    expect(isSpaceAtSafeLimit(20, 20)).toBe(true)
    expect(isSpaceAtSafeLimit(21, 20)).toBe(true)
  })

  it('is below the limit while the count is under the quota', () => {
    expect(isSpaceAtSafeLimit(19, 20)).toBe(false)
  })

  it('is never at the limit on an unlimited plan or with an unknown count', () => {
    expect(isSpaceAtSafeLimit(400, null)).toBe(false)
    expect(isSpaceAtSafeLimit(undefined, 20)).toBe(false)
  })

  it('is never at the limit while the limit itself is unknown', () => {
    expect(isSpaceAtSafeLimit(400, undefined)).toBe(false)
  })
})

describe('countSeats', () => {
  it('counts one seat per address, however many chains and whatever the casing', () => {
    expect(countSeats(['0xAbC', '0xabc', '0xDEF'])).toBe(2)
    expect(countSeats([])).toBe(0)
  })

  it('reads the address out of a chainId:address key', () => {
    expect(addressOfSafeKey('100:0xAbC')).toBe('0xAbC')
    expect(countSeats(['1:0xA', '10:0xA', '1:0xB'].map(addressOfSafeKey))).toBe(2)
  })
})
