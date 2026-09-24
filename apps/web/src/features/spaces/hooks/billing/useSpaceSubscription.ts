import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSubscriptionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
import { getPlanStatus, isNoSubscription, selectCurrentSubscription, selectLatestSubscription } from './subscription'
import { useBillingSpaceId } from './useBillingSpaceId'
import { useRateLimitRetry } from './useRateLimitRetry'

export const useSpaceSubscription = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const { currentData, isLoading, isFetching, isUninitialized, isError, error, refetch } =
    useBillingGetSubscriptionsV1Query(gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken, SPACE_REFRESH_OPTIONS)
  const isRetrying = useRateLimitRetry({ error, refetch })
  const hasNoSubscription = isNoSubscription(error)
  const data = hasNoSubscription ? [] : currentData
  const subscription = selectCurrentSubscription(data)

  return {
    subscription,
    latestSubscription: selectLatestSubscription(data),
    status: getPlanStatus(subscription),
    /** Stripe holds a default payment method for the subscription or its customer; absent from older CGWs reads as false. */
    hasPaymentMethod: subscription?.hasPaymentMethod === true,
    isLoading: isLoading || (isFetching && data === undefined) || isRetrying,
    isUninitialized,
    isError: isError && !isRetrying && !hasNoSubscription,
    refetch,
  }
}
