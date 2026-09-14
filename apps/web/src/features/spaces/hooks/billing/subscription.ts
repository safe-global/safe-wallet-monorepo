import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

export type PlanStatus = 'none' | 'trialing' | 'active' | 'pending' | 'payment_failed' | 'canceled'

// Mirrors the CGW's ACTIVE_SUBSCRIPTION_STATUSES: the statuses that occupy a Workspace's single subscription slot.
const ACTIVE_STATUSES = new Set<Subscription['status']>(['active', 'trialing'])
const PAYMENT_FAILED_STATUSES = new Set<Subscription['status']>(['past_due', 'unpaid'])
const CANCELED_STATUSES = new Set<Subscription['status']>(['canceled', 'incomplete_expired', 'paused'])

/** The subscription holding the Workspace's slot, else the most relevant non-canceled one (e.g. past_due). */
export const selectCurrentSubscription = (subscriptions: Subscription[] | undefined): Subscription | undefined =>
  subscriptions?.find((sub) => ACTIVE_STATUSES.has(sub.status)) ??
  subscriptions?.find((sub) => !CANCELED_STATUSES.has(sub.status))

/** A subscription that grants Safe Pro right now: paid, or on its free trial. */
export const isLivePlanStatus = (status: PlanStatus): boolean => status === 'active' || status === 'trialing'

/** Mirrors the CGW's UPDATABLE_SUBSCRIPTION_STATUSES, which are the live ones too. */
export const isPlanChangeable = isLivePlanStatus

export const getPlanStatus = (subscription: Subscription | undefined): PlanStatus => {
  if (!subscription) return 'none'
  if (subscription.status === 'trialing') return 'trialing'
  if (subscription.status === 'active') return 'active'
  if (PAYMENT_FAILED_STATUSES.has(subscription.status)) return 'payment_failed'
  if (CANCELED_STATUSES.has(subscription.status)) return 'canceled'
  return 'pending'
}
