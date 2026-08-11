import type { Subscription, SubscriptionUsage, UsageStatus } from '../../types'

export const APPROACHING_THRESHOLD = 0.8

export const getMetricStatus = (used: number, total: number): UsageStatus => {
  if (total <= 0) return 'within_limit'
  const ratio = used / total
  if (ratio >= 1) return 'limit_reached'
  if (ratio >= APPROACHING_THRESHOLD) return 'approaching_limit'
  return 'within_limit'
}

export const getUsageStatus = (usage: SubscriptionUsage, subscription: Subscription): UsageStatus => {
  if (subscription.status === 'past_due') return 'payment_failed'

  const ratio = Math.max(
    usage.feeFreeVolume.usedUsd / usage.feeFreeVolume.allowanceUsd,
    usage.gaslessTransactions.used / usage.gaslessTransactions.allowance,
  )

  return getMetricStatus(ratio, 1)
}
