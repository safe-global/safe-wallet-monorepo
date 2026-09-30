import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSpacePaymentLinksV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getTrialPeriodDays, groupOffersByPlan, splitPlansByTrial } from './paymentLinks'
import { useBillingSpaceId } from './useBillingSpaceId'
import { useRateLimitRetry } from './useRateLimitRetry'

/** Already filtered server-side for trial eligibility and the current plan. */
export const useSpaceOffers = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const {
    currentData: data,
    isLoading,
    isFetching,
    isUninitialized,
    isError,
    error,
    refetch,
  } = useBillingGetSpacePaymentLinksV1Query(gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken)
  const isRetrying = useRateLimitRetry({ error, refetch })
  const plans = useMemo(() => groupOffersByPlan(data ?? []), [data])
  const { trialPlans, paidPlans } = useMemo(() => splitPlansByTrial(plans), [plans])

  return {
    plans,
    trialPlans,
    paidPlans,
    trialPeriodDays: getTrialPeriodDays(trialPlans),
    isLoading: isLoading || (isFetching && data === undefined) || isRetrying,
    isUninitialized,
    isError: isError && !isRetrying,
    hasData: data !== undefined,
    refetch,
  }
}
