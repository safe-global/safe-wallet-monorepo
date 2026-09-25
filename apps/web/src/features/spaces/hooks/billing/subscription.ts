import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getPlanDescriptions, getSeatsFromMetadata } from './paymentLinks'
import type { PlanOffer } from './types'

export type PlanStatus = 'none' | 'trialing' | 'active' | 'pending' | 'payment_failed' | 'canceled'

// Mirrors the CGW's ACTIVE_SUBSCRIPTION_STATUSES: the statuses that occupy a Workspace's single subscription slot.
const ACTIVE_STATUSES = new Set<Subscription['status']>(['active', 'trialing'])
const PAYMENT_FAILED_STATUSES = new Set<Subscription['status']>(['past_due', 'unpaid'])
const CANCELED_STATUSES = new Set<Subscription['status']>(['canceled', 'incomplete_expired', 'paused'])

/** From this many days before your free access ends the UI turns to warnings and reminders. */
export const TRIAL_ENDING_SOON_DAYS = 7
/** From here on the trial label counts down; further out it just says "Free access". */
export const TRIAL_COUNTDOWN_DAYS = 14

export const trialLabel = (daysLeft: number | null | undefined): string => {
  if (daysLeft == null || daysLeft > TRIAL_COUNTDOWN_DAYS) return 'Free access'
  return `Free access · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
}

export const DAY_MS = 24 * 60 * 60 * 1_000

/** The subscription holding the Workspace's slot, else the most relevant non-canceled one (e.g. past_due). */
export const selectCurrentSubscription = (subscriptions: Subscription[] | undefined): Subscription | undefined =>
  subscriptions?.find((sub) => ACTIVE_STATUSES.has(sub.status)) ??
  subscriptions?.find((sub) => !CANCELED_STATUSES.has(sub.status))

/** A subscription that grants Safe Pro right now: paid, or on its free access. */
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

/** The plan's display name: the CGW puts it on the plan or, for Stripe-tagged subscriptions, in `metadata.planName`. */
export const getSubscriptionPlanName = (subscription: Subscription | undefined): string | null => {
  if (!subscription) return null
  const metadata = (subscription.metadata ?? {}) as Record<string, unknown>
  const fromMetadata = metadata.planName
  return subscription.plan.name ?? (typeof fromMetadata === 'string' && fromMetadata ? fromMetadata : null)
}

/** When the current billing period (or trial) ends, as an ISO date; Stripe reports seconds. */
export const getSubscriptionPeriodEnd = (subscription: Subscription | undefined): string | null =>
  subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd * 1000).toISOString() : null

/** The plan's selling points: from the plan itself, else from the Stripe metadata the CGW forwards. */
export const getSubscriptionFeatures = (subscription: Subscription): string[] =>
  subscription.plan.features.length > 0
    ? subscription.plan.features
    : getPlanDescriptions((subscription.metadata ?? {}) as Record<string, string | null | undefined>)

/** Right as soon as a plan change applies, while the entitlements still wait for the billing webhook. */
export const getSubscriptionSeats = (subscription: Subscription): PlanOffer['seats'] =>
  getSeatsFromMetadata((subscription.metadata ?? {}) as Record<string, string | null | undefined>)
