import { formatPolicyChangeDelay, formatPolicyChangeDelayAdjective } from '../constants'

describe('formatPolicyChangeDelayAdjective', () => {
  it.each([
    [0, '0-second'],
    [60, '1-minute'],
    [180, '3-minute'],
    [600, '10-minute'],
    [3_600, '1-hour'],
    [7_200, '2-hour'],
    [86_400, '1-day'],
    [172_800, '2-day'],
    [5_400, '1-hour 30-minute'],
  ])('should say %i seconds as %s', (seconds, adjective) => {
    expect(formatPolicyChangeDelayAdjective(seconds)).toBe(adjective)
  })
})

describe('formatPolicyChangeDelay', () => {
  it.each([
    [0, '0 seconds'],
    [60, '1 minute'],
    [600, '10 minutes'],
    [86_400, '1 day'],
  ])('should say %i seconds as %s', (seconds, delay) => {
    expect(formatPolicyChangeDelay(seconds)).toBe(delay)
  })
})
