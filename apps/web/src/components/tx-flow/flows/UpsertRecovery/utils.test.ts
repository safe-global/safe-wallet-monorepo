import { formatRecoveryPeriod } from './utils'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'

describe('formatRecoveryPeriod', () => {
  it.each([
    [60, '1 minute'],
    [60 * 60, '1 hour'],
    [DAY_IN_SECONDS, '1 day'],
    [DAY_IN_SECONDS * 28, '28 days'],
    [DAY_IN_SECONDS * 56, '56 days'],
    [DAY_IN_SECONDS * 3 + 60 * 60 * 5, '3 days, 5 hours'],
    [DAY_IN_SECONDS + 60 * 60 + 60 + 1, '1 day, 1 hour, 1 minute, 1 second'],
    [45, '45 seconds'],
  ])('formats %d seconds as "%s"', (seconds, expected) => {
    expect(formatRecoveryPeriod(seconds)).toBe(expected)
  })
})
