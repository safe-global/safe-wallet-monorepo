import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSubscriptionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useCurrentSpaceId } from '@/features/spaces'
import { selectActiveSubscription } from './subscriptionState'

interface BillingSubscriptionResult {
  subscription: Subscription | undefined
  subscriptions: Subscription[] | undefined
  isLoading: boolean
  refetch: () => void
}

/**
 * Loads the current space's subscriptions and resolves the single active one.
 * `subscription` is `undefined` while loading or when the space is on the free
 * tier — callers must distinguish via `isLoading`.
 */
export const useBillingSubscription = (): BillingSubscriptionResult => {
  const spaceId = useCurrentSpaceId()
  const { data, isLoading, isFetching, refetch } = useBillingGetSubscriptionsV1Query(spaceId ? { spaceId } : skipToken)

  return {
    subscription: selectActiveSubscription(data),
    subscriptions: data,
    isLoading: isLoading || isFetching,
    refetch,
  }
}
