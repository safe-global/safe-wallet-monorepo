import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSpacePaymentLinksV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getTrialPeriodDays, groupOffersByPlan, splitPlansByTrial } from './paymentLinks'
import { useBillingSpaceId } from './useBillingSpaceId'

/**
 * The plans the CGW offers this Workspace, already filtered server-side for trial eligibility and current plan.
 * `trialPlans` feed the first-entry trial flows; `paidPlans` feed the Plans page.
 */
export const useSpaceOffers = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const { data, isLoading, isError } = useBillingGetSpacePaymentLinksV1Query(
    gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken,
  )
  const plans = useMemo(() => groupOffersByPlan(data ?? []), [data])
  const { trialPlans, paidPlans } = useMemo(() => splitPlansByTrial(plans), [plans])

  return { plans, trialPlans, paidPlans, trialPeriodDays: getTrialPeriodDays(trialPlans), isLoading, isError }
}
