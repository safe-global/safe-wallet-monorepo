import { getMetricStatus, getUsageStatus } from '../sections/SubscriptionSection/getUsageStatus'
import type { Subscription, SubscriptionUsage } from '../types'

const subscription = (status: Subscription['status'] = 'active'): Subscription => ({
  planId: 'pro',
  planName: 'Pro',
  status,
  currentPeriodEnd: '2026-07-31T00:00:00.000Z',
})

const usage = (volumeRatio: number, gaslessRatio: number): SubscriptionUsage => ({
  feeFreeVolume: { usedUsd: volumeRatio * 500_000, allowanceUsd: 500_000 },
  gaslessTransactions: { used: gaslessRatio * 15, allowance: 15 },
  activeSafes: [],
})

describe('getUsageStatus', () => {
  it('returns within_limit below the approaching threshold', () => {
    expect(getUsageStatus(usage(0.5, 0.5), subscription())).toBe('within_limit')
  })

  it('returns within_limit just below 80%', () => {
    expect(getUsageStatus(usage(0.79, 0.1), subscription())).toBe('within_limit')
  })

  it('returns approaching_limit at exactly 80%', () => {
    expect(getUsageStatus(usage(0.8, 0.1), subscription())).toBe('approaching_limit')
  })

  it('returns approaching_limit between 80% and 100%', () => {
    expect(getUsageStatus(usage(0.1, 0.95), subscription())).toBe('approaching_limit')
  })

  it('returns limit_reached at exactly 100%', () => {
    expect(getUsageStatus(usage(1, 0.1), subscription())).toBe('limit_reached')
  })

  it('returns limit_reached when over allowance', () => {
    expect(getUsageStatus(usage(1.2, 0.1), subscription())).toBe('limit_reached')
  })

  it('uses the worst of the two allowances', () => {
    expect(getUsageStatus(usage(0.1, 1), subscription())).toBe('limit_reached')
  })

  it('returns payment_failed for a past_due subscription regardless of usage', () => {
    expect(getUsageStatus(usage(0.1, 0.1), subscription('past_due'))).toBe('payment_failed')
  })
})

describe('getMetricStatus', () => {
  it('returns within_limit below the threshold', () => {
    expect(getMetricStatus(79, 100)).toBe('within_limit')
  })

  it('returns approaching_limit at exactly 80%', () => {
    expect(getMetricStatus(80, 100)).toBe('approaching_limit')
  })

  it('returns limit_reached at or above 100%', () => {
    expect(getMetricStatus(100, 100)).toBe('limit_reached')
    expect(getMetricStatus(120, 100)).toBe('limit_reached')
  })

  it('returns within_limit when total is zero', () => {
    expect(getMetricStatus(5, 0)).toBe('within_limit')
  })
})
