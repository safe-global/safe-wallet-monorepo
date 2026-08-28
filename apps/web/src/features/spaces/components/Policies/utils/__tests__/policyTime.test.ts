import { formatPolicyDateTime, formatResetTime } from '../policyTime'

describe('formatPolicyDateTime', () => {
  it('should, when given a creation time, render it in UTC and name the zone', () => {
    expect(formatPolicyDateTime(1_782_272_100)).toBe('06.24.26 03:35 AM UTC')
  })
})

describe('formatResetTime', () => {
  it('should, when given a reset time, render it in UTC and name the zone', () => {
    expect(formatResetTime(1_790_812_800)).toBe('Resets Oct 1, 00:00 UTC')
  })
})
