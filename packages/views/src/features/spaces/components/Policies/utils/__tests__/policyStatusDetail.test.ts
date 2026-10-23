import { formatAppliesAt } from '../policyStatusDetail'

describe('formatAppliesAt', () => {
  /** 2026-10-13T13:02:00Z, in unix seconds. */
  const APPLIES_AT = 1_791_896_520

  it('should give the hours left and the UTC time', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 24 * 3_600) * 1_000)).toBe('Applies in 24h · Oct 13, 13:02 UTC')
  })

  it('should round a part hour up', () => {
    expect(formatAppliesAt(APPLIES_AT, (APPLIES_AT - 90 * 60) * 1_000)).toMatch(/^Applies in 2h/)
  })

  it('should never say less than an hour', () => {
    expect(formatAppliesAt(APPLIES_AT, APPLIES_AT * 1_000)).toMatch(/^Applies in 1h/)
  })
})
