import { formatApplyIn, formatTimeLeft, formatTimeToSign, formatUtcDateTime, hoursUntil } from './format'

/** 2026-10-21T12:00:00Z, in unix seconds. */
const EXPIRES_AT = 1_792_584_000
const DAY = 86_400
const HOUR = 3_600

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

describe('formatApplyIn', () => {
  it('should give the hours and minutes left', () => {
    expect(formatApplyIn(EXPIRES_AT, nowMs(DAY - 60))).toBe('Apply in 23h 59m')
  })

  it('should never round a part minute up to 60', () => {
    expect(formatApplyIn(EXPIRES_AT, nowMs(DAY - 30))).toBe('Apply in 23h 59m')
  })

  it('should give at least a minute in the last hour', () => {
    expect(formatApplyIn(EXPIRES_AT, nowMs(20))).toBe('Apply in 1m')
  })
})

describe('formatTimeLeft', () => {
  it('should give hours and minutes within the last day', () => {
    expect(formatTimeLeft(EXPIRES_AT, nowMs(DAY - 60))).toBe('23h 59m left')
  })

  it('should count whole days otherwise', () => {
    expect(formatTimeLeft(EXPIRES_AT, nowMs(6.5 * DAY))).toBe('6 days left')
    expect(formatTimeLeft(EXPIRES_AT, nowMs(DAY))).toBe('1 day left')
  })
})

describe('hoursUntil', () => {
  it('should round up, so a wait that just started reads 24', () => {
    expect(hoursUntil(EXPIRES_AT, nowMs(DAY - 60))).toBe(24)
    expect(hoursUntil(EXPIRES_AT, nowMs(2 * HOUR + 1))).toBe(3)
  })

  it('should never go below one', () => {
    expect(hoursUntil(EXPIRES_AT, nowMs(-HOUR))).toBe(1)
  })
})

describe('formatUtcDateTime', () => {
  it('should give the UTC date and time', () => {
    expect(formatUtcDateTime(EXPIRES_AT + 2.5 * HOUR)).toBe('Oct 21, 2026 · 14:30 UTC')
  })

  it('should write midnight as 00:00', () => {
    expect(formatUtcDateTime(EXPIRES_AT + 12 * HOUR)).toBe('Oct 22, 2026 · 00:00 UTC')
  })
})
