import {
  formatDate,
  formatTimeUntil,
  formatUtcDate,
  formatUtcDateTime,
  formatUtcDayTime,
  getCountdown,
  getDetailedPeriod,
  getPeriod,
  parseTimestamp,
} from '../date'

describe('formatDate', () => {
  it('formats a timestamp as an abbreviated date', () => {
    expect(formatDate(new Date('2026-04-22T12:00:00.000Z').getTime())).toBe('Apr 22, 2026')
  })
})

/** 2026-10-21T12:00:00Z, in unix seconds. */
const OCT_21_NOON_UTC = 1_792_584_000
/** 2026-10-22T00:00:00Z, in unix seconds. */
const OCT_22_MIDNIGHT_UTC = 1_792_627_200

describe('formatUtcDate', () => {
  it('should give the UTC calendar date, when given unix seconds', () => {
    expect(formatUtcDate(OCT_21_NOON_UTC)).toBe('Oct 21, 2026')
  })
})

describe('formatUtcDayTime', () => {
  it('should give the UTC day and time without the year, when given unix seconds', () => {
    expect(formatUtcDayTime(OCT_21_NOON_UTC + 2.5 * 3_600)).toBe('Oct 21, 14:30 UTC')
  })

  it('should write midnight as 00:00, when the time is a UTC midnight', () => {
    expect(formatUtcDayTime(OCT_22_MIDNIGHT_UTC)).toBe('Oct 22, 00:00 UTC')
  })
})

describe('formatUtcDateTime', () => {
  it('should give the UTC date and time, when given unix seconds', () => {
    expect(formatUtcDateTime(OCT_21_NOON_UTC + 2.5 * 3_600)).toBe('Oct 21, 2026 · 14:30 UTC')
  })

  it('should write midnight as 00:00, when the time is a UTC midnight', () => {
    expect(formatUtcDateTime(OCT_22_MIDNIGHT_UTC)).toBe('Oct 22, 2026 · 00:00 UTC')
  })
})

describe('formatTimeUntil', () => {
  it('should give the hours and minutes left, when less than a day is left', () => {
    expect(formatTimeUntil(OCT_21_NOON_UTC, (OCT_21_NOON_UTC - 23 * 3_600 - 59 * 60) * 1_000)).toBe(
      '23 hours 59 minutes',
    )
  })

  it('should give the minutes left, when less than an hour is left', () => {
    expect(formatTimeUntil(OCT_21_NOON_UTC, (OCT_21_NOON_UTC - 9 * 60) * 1_000)).toBe('9 minutes')
  })

  it('should say less than a minute, when the time has passed', () => {
    expect(formatTimeUntil(OCT_21_NOON_UTC, (OCT_21_NOON_UTC + 60) * 1_000)).toBe('less than a minute')
  })
})

describe('parseTimestamp', () => {
  it('parses an ISO string to a timestamp', () => {
    expect(parseTimestamp('2026-04-22T12:00:00.000Z')).toBe(1776859200000)
  })

  it('returns null for null, undefined, and empty values', () => {
    expect(parseTimestamp(null)).toBeNull()
    expect(parseTimestamp(undefined)).toBeNull()
    expect(parseTimestamp('')).toBeNull()
  })

  it('returns null for unparseable values', () => {
    expect(parseTimestamp('not-a-date')).toBeNull()
  })
})

describe('getCountdown', () => {
  it('should convert 0 seconds to 0 days, 0 hours, and 0 minutes', () => {
    const result = getCountdown(0)
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('should convert 3600 seconds to 0 days, 1 hour, and 0 minutes', () => {
    const result = getCountdown(3600)
    expect(result).toEqual({ days: 0, hours: 1, minutes: 0 })
  })

  it('should convert 86400 seconds to 1 day, 0 hours, and 0 minutes', () => {
    const result = getCountdown(86400)
    expect(result).toEqual({ days: 1, hours: 0, minutes: 0 })
  })

  it('should convert 123456 seconds to 1 day, 10 hours, and 17 minutes', () => {
    const result = getCountdown(123456)
    expect(result).toEqual({ days: 1, hours: 10, minutes: 17 })
  })
})

describe('getPeriod', () => {
  it('returns correct period for days', () => {
    expect(getPeriod(86400)).toBe('1 day')
    expect(getPeriod(172800)).toBe('2 days')
  })

  it('returns correct period for hours', () => {
    expect(getPeriod(3600)).toBe('1 hour')
    expect(getPeriod(7200)).toBe('2 hours')
  })

  it('returns correct period for minutes', () => {
    expect(getPeriod(60)).toBe('1 minute')
    expect(getPeriod(120)).toBe('2 minutes')
  })

  it('returns undefined for seconds less than 60', () => {
    expect(getPeriod(59)).toBeUndefined()
  })

  it('returns correct period when there are multiple units', () => {
    expect(getPeriod(90000)).toBe('1 day')
    expect(getPeriod(86400 + 3600)).toBe('1 day')
    expect(getPeriod(86400 + 3600 + 60)).toBe('1 day')
  })
})

describe('getDetailedPeriod', () => {
  it.each([
    [60, '1 minute'],
    [3600, '1 hour'],
    [86400, '1 day'],
    [86400 * 28, '28 days'],
    [86400 * 3 + 3600 * 5, '3 days, 5 hours'],
    [86400 + 3600 + 60 + 1, '1 day, 1 hour, 1 minute, 1 second'],
    [45, '45 seconds'],
  ])('formats %d seconds as "%s"', (seconds, expected) => {
    expect(getDetailedPeriod(seconds)).toBe(expected)
  })
})
