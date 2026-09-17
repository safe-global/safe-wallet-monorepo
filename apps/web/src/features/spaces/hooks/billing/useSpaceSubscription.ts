import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSubscriptionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
import { getPlanStatus, selectCurrentSubscription, selectLatestSubscription } from './subscription'
import { useBillingSpaceId } from './useBillingSpaceId'

export const useSpaceSubscription = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const { data, isLoading, isUninitialized, isError, refetch } = useBillingGetSubscriptionsV1Query(
    gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken,
    SPACE_REFRESH_OPTIONS,
  )
  const subscription = selectCurrentSubscription(data)

  return {
    subscription,
    latestSubscription: selectLatestSubscription(data),
    status: getPlanStatus(subscription),
    isLoading,
    isUninitialized,
    isError,
    refetch,
  }
}
