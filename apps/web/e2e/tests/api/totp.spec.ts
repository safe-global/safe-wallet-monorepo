/**
 * TOTP generator tests — pure, no browser. Vectors are the SHA-1 rows of RFC 6238, Appendix B.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { decodeBase32, generateTotp, secondsLeftInStep } from '../../src/utils/totp'

// Base32 of the ASCII seed "12345678901234567890" used by RFC 6238.
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

test.describe('TOTP generator', { tag: '@api' }, () => {
  test('decodes a base32 secret', () => {
    expect(decodeBase32(RFC_SECRET).toString('ascii')).toBe('12345678901234567890')
  })

  for (const [unixSeconds, expected] of [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ] as const) {
    test(`matches the RFC 6238 vector at ${unixSeconds}s`, () => {
      expect(generateTotp(RFC_SECRET, { timestampMs: unixSeconds * 1000, digits: 8 })).toBe(expected)
    })
  }

  test('returns six digits by default', () => {
    expect(generateTotp(RFC_SECRET, { timestampMs: 59_000 })).toBe('287082')
  })

  test('ignores padding, spaces and lower case in the secret', () => {
    expect(generateTotp('gezd gnbv gy3t qojq gezd gnbv gy3t qojq====', { timestampMs: 59_000 })).toBe('287082')
  })

  test('rejects a secret that is not base32', () => {
    expect(() => generateTotp('not-base32!', { timestampMs: 59_000 })).toThrow('Invalid base32 character')
  })

  test('reports the seconds left in the current step', () => {
    expect(secondsLeftInStep(59_000)).toBe(1)
    expect(secondsLeftInStep(60_000)).toBe(30)
  })
})
