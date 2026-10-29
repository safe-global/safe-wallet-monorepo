import { formatExactTime } from './provenance'

describe('formatExactTime', () => {
  it('should, when given an ISO timestamp, return the medium date and short time in the default locale', () => {
    expect(formatExactTime('2026-04-22T09:05:00')).toBe('Apr 22, 2026, 9:05 AM')
  })

  it('should, when the timestamp cannot be parsed, return undefined', () => {
    expect(formatExactTime('nope')).toBeUndefined()
  })
})
