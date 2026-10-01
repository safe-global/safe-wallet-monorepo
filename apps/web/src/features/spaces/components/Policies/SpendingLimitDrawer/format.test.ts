import { mockSpendingLimitPolicy } from '../mocks/policies'
import {
  formatAllowanceAmount,
  formatAwaitingSignatures,
  formatLastUpdated,
  formatRemaining,
  formatResetUtc,
  formatSignedCount,
  remainingPercent,
} from './format'

const [usdc, usdt] = mockSpendingLimitPolicy().data.spenders[0].allowances

describe('formatResetUtc', () => {
  // Unix MINUTES, as CGW returns. The suite runs under TZ=CET, so a local-time formatter would render 02:00.
  it('renders the reset instant in UTC regardless of the local zone', () => {
    expect(formatResetUtc(29_846_880)).toBe('Oct 1, 00:00 UTC')
  })

  it('uses a 24-hour clock rather than rendering midnight as 24:00', () => {
    // A different UTC midnight than the test above, so this assertion can fail independently of it.
    expect(formatResetUtc(29_891_520)).toBe('Nov 1, 00:00 UTC')
  })
})

describe('formatLastUpdated', () => {
  const at = (createdAt?: number) => ({ ...usdc, createdAt })

  // The suite runs under TZ=CET, so a local-time formatter would render 05:35.
  it('renders the time in UTC regardless of the local zone', () => {
    expect(formatLastUpdated([{ spender: '0x1', allowances: [at(1_782_272_100)] }])).toBe('Jun 24, 2026 · 03:35 UTC')
  })

  it('takes the latest allowance set across every spender', () => {
    const spenders = [
      { spender: '0x1', allowances: [at(1_782_272_100), at(1_782_316_800)] },
      { spender: '0x2', allowances: [at(1_782_400_000)] },
    ]

    expect(formatLastUpdated(spenders)).toBe('Jun 25, 2026 · 15:06 UTC')
  })

  it('uses a 24-hour clock rather than rendering midnight as 24:00', () => {
    expect(formatLastUpdated([{ spender: '0x1', allowances: [at(1_782_259_200)] }])).toBe('Jun 24, 2026 · 00:00 UTC')
  })

  it('returns nothing when no allowance carries a timestamp', () => {
    expect(formatLastUpdated([{ spender: '0x1', allowances: [at()] }])).toBeUndefined()
  })
})

describe('remainingPercent', () => {
  it('measures the headroom left, not the amount spent', () => {
    expect(remainingPercent({ amount: '1500000000', remaining: '500000000' })).toBeCloseTo(33.33, 1)
  })

  it('returns 0 for a fully spent allowance', () => {
    expect(remainingPercent({ amount: '1000', remaining: '0' })).toBe(0)
  })

  it('returns 0 rather than dividing by zero for a zero allowance', () => {
    expect(remainingPercent({ amount: '0', remaining: '0' })).toBe(0)
  })

  it('clamps above 100 when a lowered limit leaves remaining above amount', () => {
    expect(remainingPercent({ amount: '100', remaining: '500' })).toBe(100)
  })
})

describe('formatAllowanceAmount', () => {
  it('puts the period after the amount and leaves the symbol to the icon column', () => {
    expect(formatAllowanceAmount(usdc)).toBe('1,500/month')
  })

  it('reads as one time when the allowance does not repeat', () => {
    expect(formatAllowanceAmount({ ...usdt, resetPeriodMinutes: 0 })).toBe('1,000 one time')
  })
})

describe('formatRemaining', () => {
  it('names the token, because the row shows several', () => {
    expect(formatRemaining(usdc)).toBe('500 USDC remaining')
  })
})

describe('formatSignedCount', () => {
  it.each([
    [1, 3, '1 of 3 signed'],
    [2, 2, '2 of 2 signed'],
  ])('renders %i of %i', (signed, required, expected) => {
    expect(formatSignedCount(signed, required)).toBe(expected)
  })
})

describe('formatAwaitingSignatures', () => {
  it('stays singular for the last outstanding signature', () => {
    expect(formatAwaitingSignatures(1)).toBe('Waiting for 1 more signature')
  })

  it('pluralises beyond one', () => {
    expect(formatAwaitingSignatures(2)).toBe('Waiting for 2 more signatures')
  })
})
