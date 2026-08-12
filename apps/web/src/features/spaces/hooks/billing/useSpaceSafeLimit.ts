import { useBillingSubscription } from './useBillingSubscription'
import { FREE_NUMBER_OF_SAFES, getSubscriptionNumberOfSafes } from './features'

interface SpaceSafeLimitResult {
  /** Max Safe accounts allowed in the current space (free tier or plan feature). */
  limit: number
  /** `true` while subscriptions load — callers should not block on the limit yet. */
  isLoading: boolean
}

/**
 * The dynamic Safe-account limit for the current space: `FREE_NUMBER_OF_SAFES`
 * (1) with no paid plan, or the active subscription's `FEATURE_NUMBER_OF_SAFES`.
 *
 * While loading, `limit` falls back to the free tier but `isLoading` is `true`,
 * so gating callers must wait rather than block a legitimately-subscribed user.
 */
export const useSpaceSafeLimit = (): SpaceSafeLimitResult => {
  const { subscription, isLoading } = useBillingSubscription()

  return {
    limit: isLoading ? FREE_NUMBER_OF_SAFES : getSubscriptionNumberOfSafes(subscription),
    isLoading,
  }
}
