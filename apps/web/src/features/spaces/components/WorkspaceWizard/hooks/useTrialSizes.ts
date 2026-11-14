import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetTrialPlansV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { getTrialPeriodDays, groupOffersByPlan, splitPlansByTrial } from '../../../hooks/billing/paymentLinks'
import { trialSizes } from '../../Plans/planTiers'

/** The trial sizes a brand-new Workspace can start; `sizes` is undefined while they load. */
export const useTrialSizes = () => {
  const isSafePro = useIsSafeProEnabled()
  const { currentData, isLoading, isError, refetch } = useBillingGetTrialPlansV1Query(isSafePro ? undefined : skipToken)

  const { trialPlans } = useMemo(() => splitPlansByTrial(groupOffersByPlan(currentData ?? [])), [currentData])
  const sizes = useMemo(() => (currentData ? trialSizes(trialPlans) : undefined), [currentData, trialPlans])

  return { sizes, trialPeriodDays: getTrialPeriodDays(trialPlans), isLoading, isError, refetch }
}
