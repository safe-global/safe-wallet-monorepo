import { formatAppliesAt } from '../policyStatusDetail'

describe('formatAppliesAt', () => {
  /** 2026-10-13T13:02:00Z, in unix seconds. */
  const APPLIES_AT = 1_791_896_520

  it('should give the time left and the UTC time, when the change is a day away', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 24 * 3_600) * 1_000)).toBe('Applies in 1 day · Oct 13, 13:02 UTC')
  })

  it('should give the minutes left, when the change is under an hour away', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 9 * 60) * 1_000)).toBe('Applies in 9 minutes · Oct 13, 13:02 UTC')
  })

  it('should say less than a minute, when the change is due', () => {
    expect(formatAppliesAt(APPLIES_AT, APPLIES_AT * 1_000)).toMatch(/^Applies in less than a minute · /)
  })
})
