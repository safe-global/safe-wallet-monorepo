import { formatTimeToSign } from './format'

/** 2026-10-21T12:00:00Z, in unix seconds. */
const EXPIRES_AT = 1_792_584_000
const DAY = 86_400

const nowMs = (secondsBefore: number): number => (EXPIRES_AT - secondsBefore) * 1_000

describe('formatTimeToSign', () => {
  it('should count the whole days left and give the UTC date', () => {
    expect(formatTimeToSign(EXPIRES_AT, nowMs(6.5 * DAY))).toBe('6 days left · until Oct 21, 2026')
  })

  it('should use the singular for one day', () => {
    expect(formatTimeToSign(EXPIRES_AT, nowMs(1.2 * DAY))).toBe('1 day left · until Oct 21, 2026')
  })

  it('should say less than a day is left on the last day', () => {
    expect(formatTimeToSign(EXPIRES_AT, nowMs(3_600))).toBe('Less than a day left · until Oct 21, 2026')
  })
})
