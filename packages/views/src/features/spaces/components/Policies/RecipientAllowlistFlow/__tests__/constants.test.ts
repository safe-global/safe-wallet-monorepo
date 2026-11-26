import { formatPolicyChangeDelay } from '../constants'

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
