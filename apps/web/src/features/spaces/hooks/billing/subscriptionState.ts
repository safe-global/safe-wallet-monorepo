import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

/**
 * High-level billing state the UI renders from. Combines the Stripe
 * subscription lifecycle with our usage-derived states:
 * - `none`: no paid plan (Starter / upsell).
 * - `activating`: payment done, waiting for the subscription to appear (post-checkout polling).
 * - `active`: a live paid plan; usage status (within/approaching/limit) is layered on top.
 * - `payment_failed`: past_due / unpaid — renewal failed.
 * - `canceled`: canceled or ended.
 */
export type BillingState = 'none' | 'activating' | 'active' | 'payment_failed' | 'canceled'

const ACTIVE_STATUSES = new Set<Subscription['status']>(['active', 'trialing'])
const PAYMENT_FAILED_STATUSES = new Set<Subscription['status']>(['past_due', 'unpaid'])
const CANCELED_STATUSES = new Set<Subscription['status']>(['canceled', 'incomplete_expired', 'paused'])

/**
 * Derives the billing state from the active subscription (if any) and whether a
 * post-checkout activation is in progress.
 *
 * `isActivating` comes from the return-from-Stripe polling: the payment is
 * confirmed but the subscription hasn't propagated yet.
 */
export const getBillingState = (subscription: Subscription | undefined, isActivating = false): BillingState => {
  if (subscription) {
    if (ACTIVE_STATUSES.has(subscription.status)) return 'active'
    if (PAYMENT_FAILED_STATUSES.has(subscription.status)) return 'payment_failed'
    if (CANCELED_STATUSES.has(subscription.status)) return 'canceled'
    // `incomplete` — payment is still settling; treat as activating.
    return 'activating'
  }

  return isActivating ? 'activating' : 'none'
}

/**
 * The single active subscription for a space, if any. The CGW returns an array
 * (Stripe can hold historical entries); we pick the first non-canceled one.
 */
export const selectActiveSubscription = (subscriptions: Subscription[] | undefined): Subscription | undefined =>
  subscriptions?.find((sub) => !CANCELED_STATUSES.has(sub.status))
