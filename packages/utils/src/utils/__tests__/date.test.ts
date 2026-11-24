import { formatDate, formatShortTimeAgo, getCountdown, getDetailedPeriod, getPeriod, parseTimestamp } from '../date'

describe('formatDate', () => {
  it('formats a timestamp as an abbreviated date', () => {
    expect(formatDate(new Date('2026-04-22T12:00:00.000Z').getTime())).toBe('Apr 22, 2026')
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

describe('formatShortTimeAgo', () => {
  const now = new Date('2026-06-15T12:00:00.000Z').getTime()
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const ago = (ms: number) => formatShortTimeAgo(now - ms, now)

  it.each([
    ['Just now', 0],
    ['Just now', 59_999],
    ['1m ago', MINUTE],
    ['59m ago', HOUR - 1],
    ['1h ago', HOUR],
    ['23h ago', DAY - 1],
    ['1d ago', DAY],
    ['3d ago', 3 * DAY],
    ['30d ago', 30 * DAY + HOUR],
  ])('shows %s for %i ms ago', (expected, ms) => {
    expect(ago(ms)).toBe(expected)
  })

  it.each([
    ['1mo ago', '2026-05-15T12:00:00.000Z'],
    ['11mo ago', '2025-06-16T12:00:00.000Z'],
    ['1y ago', '2025-06-15T12:00:00.000Z'],
    ['3y ago', '2023-01-01T00:00:00.000Z'],
  ])('shows %s for %s', (expected, date) => {
    expect(formatShortTimeAgo(new Date(date).getTime(), now)).toBe(expected)
  })

  it('never shows 12mo ago at month end', () => {
    // date-fns counts months in local time, so build the dates in local time too.
    // From Feb 28 at month end, Feb 28 23:00 a year earlier is 12 months back but
    // not a full year, which used to read as "12mo ago".
    const feb28 = new Date(2026, 1, 28).getTime()
    expect(formatShortTimeAgo(new Date(2025, 1, 28, 23).getTime(), feb28)).toBe('1y ago')
    expect(formatShortTimeAgo(new Date(2025, 2, 1).getTime(), feb28)).toBe('11mo ago')
    expect(formatShortTimeAgo(new Date(2025, 1, 27, 23).getTime(), feb28)).toBe('1y ago')
  })

  it('reads a time in the future as Just now', () => {
    expect(formatShortTimeAgo(now + HOUR, now)).toBe('Just now')
  })

  it('defaults to the current time', () => {
    jest.useFakeTimers({ now })
    try {
      expect(formatShortTimeAgo(now - 2 * HOUR)).toBe('2h ago')
    } finally {
      jest.useRealTimers()
    }
  })
})
