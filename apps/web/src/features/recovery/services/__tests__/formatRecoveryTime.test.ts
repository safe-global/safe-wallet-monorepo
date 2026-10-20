import { formatRecoveryTime } from '../formatRecoveryTime'

const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1)

// Delay Modifier on sep:0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9 (WA-3903)
const CREATED_AT_MS = BigInt(1_792_079_184) * BigInt(1000)
const COOLDOWN_SECONDS = BigInt(86_400_000_000_000)

describe('formatRecoveryTime', () => {
  const formatDate = (timestampMs: number) => new Date(timestampMs).toISOString()

  it('formats a timestamp within the Date range as a date', () => {
    const validFrom = CREATED_AT_MS + BigInt(28 * 24 * 60 * 60 * 1000)

    expect(formatRecoveryTime(validFrom, CREATED_AT_MS, formatDate)).toBe('2026-11-12T15:46:24.000Z')
  })

  it('formats the latest representable date as a date', () => {
    const maxDateMs = BigInt(8_640_000_000_000_000)

    expect(formatRecoveryTime(maxDateMs, CREATED_AT_MS, formatDate)).toBe('+275760-09-13T00:00:00.000Z')
  })

  it('shows a cooldown past the Date range as an offset from creation', () => {
    const validFrom = CREATED_AT_MS + COOLDOWN_SECONDS * BigInt(1000)
    const formatDate = jest.fn()

    expect(formatRecoveryTime(validFrom, CREATED_AT_MS, formatDate)).toBe('1000000000 days after creation')
    expect(formatDate).not.toHaveBeenCalled()
  })

  it('includes the remainder of an offset in the period', () => {
    const offsetSeconds = COOLDOWN_SECONDS + BigInt(3 * 60 * 60 + 5 * 60)
    const expiresAt = CREATED_AT_MS + offsetSeconds * BigInt(1000)

    expect(formatRecoveryTime(expiresAt, CREATED_AT_MS, formatDate)).toBe(
      '1000000000 days, 3 hours, 5 minutes after creation',
    )
  })

  it('does not throw for the largest uint256 cooldown and expiry', () => {
    const expiresAt = (CREATED_AT_MS / BigInt(1000) + MAX_UINT256 + MAX_UINT256) * BigInt(1000)

    expect(formatRecoveryTime(expiresAt, CREATED_AT_MS, formatDate)).toMatch(/ days.* after creation$/)
  })
})
