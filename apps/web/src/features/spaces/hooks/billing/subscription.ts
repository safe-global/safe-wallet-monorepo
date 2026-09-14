import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

export type PlanStatus = 'none' | 'trialing' | 'active' | 'pending' | 'payment_failed' | 'canceled'

// Mirrors the CGW's ACTIVE_SUBSCRIPTION_STATUSES: the statuses that occupy a Workspace's single subscription slot.
const ACTIVE_STATUSES = new Set<Subscription['status']>(['active', 'trialing'])
const PAYMENT_FAILED_STATUSES = new Set<Subscription['status']>(['past_due', 'unpaid'])
const CANCELED_STATUSES = new Set<Subscription['status']>(['canceled', 'incomplete_expired', 'paused'])

/** From this many days before the trial ends the UI turns to warnings and reminders. */
export const TRIAL_ENDING_SOON_DAYS = 7

export const DAY_MS = 24 * 60 * 60 * 1_000

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

/** Whole days until the period ends, never negative; null without a known end. */
export const getDaysLeft = (periodEndsAt: string | null | undefined, now = Date.now()): number | null => {
  if (!periodEndsAt) return null
  const end = Date.parse(periodEndsAt)
  if (Number.isNaN(end)) return null
  return Math.max(Math.ceil((end - now) / DAY_MS), 0)
}

/** The most recently created subscription, live or not: its end date explains a lapsed Workspace. */
export const selectLatestSubscription = (subscriptions: Subscription[] | undefined): Subscription | undefined =>
  subscriptions?.reduce<Subscription | undefined>(
    (latest, candidate) => (!latest || candidate.createdAt > latest.createdAt ? candidate : latest),
    undefined,
  )

/** When a subscription stopped covering the Workspace, in ms (Stripe reports seconds). */
export const getSubscriptionEndedAt = (subscription: Subscription | undefined): number | null => {
  const seconds = subscription?.cancelledAt ?? subscription?.currentPeriodEnd ?? null
  return seconds == null ? null : seconds * 1000
}
