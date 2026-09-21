import { formatDate, getCountdown, getPeriod, parseTimestamp } from '../date'

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
