import { skipToken } from '@reduxjs/toolkit/query'
import { useEntitlementsGetEntitlementsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
import { getSeatsMeter, getSponsoredTxsMeter } from './entitlements'
import { useBillingSpaceId } from './useBillingSpaceId'
import { useRateLimitRetry } from './useRateLimitRetry'

export const useSpaceEntitlements = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const {
    currentData: data,
    isLoading,
    isFetching,
    isUninitialized,
    isError,
    error,
    refetch,
  } = useEntitlementsGetEntitlementsV1Query(gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken, SPACE_REFRESH_OPTIONS)

  const isRetrying = useRateLimitRetry({ error, refetch })

  return {
    plan: data?.plan ?? null,
    seats: getSeatsMeter(data),
    sponsoredTxs: getSponsoredTxsMeter(data),
    // `currentData` is empty while another Workspace's result is on its way; that gap reads as loading, not as no plan.
    isLoading: isLoading || (isFetching && data === undefined) || isRetrying,
    isUninitialized,
    isError: isError && !isRetrying,
    refetch,
  }
}
