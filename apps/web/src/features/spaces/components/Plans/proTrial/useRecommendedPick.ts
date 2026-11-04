import { useMemo } from 'react'
import { RECOMMENDED_PLAN } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import type { PlanPick } from '@safe-global/views/features/spaces/components/Plans/types'
import { useSpaceOffers } from '../../../hooks/billing/useSpaceOffers'
import { useSpaceSafeCount } from '../../../hooks/useIsCurrentSpaceAtSafeLimit'
import { buildPlanTiers } from '../planTiers'
import { recommendSeats } from './recommendPlan'

/** The monthly Business size that fits the Workspace's Safes, for every "Upgrade to <plan>" outside the plans page. */
export const useRecommendedPick = (spaceId: string): { pick: PlanPick | undefined; safeCount: number | undefined } => {
  const { paidPlans } = useSpaceOffers(spaceId)
  const safeCount = useSpaceSafeCount(spaceId)

  const pick = useMemo(() => {
    if (safeCount === undefined) return undefined
    const tier = buildPlanTiers(paidPlans).find(
      (candidate) => candidate.name === RECOMMENDED_PLAN && candidate.billingCycle === 'month',
    )
    const option = tier?.options.find((candidate) => candidate.seats === recommendSeats(safeCount))
    return tier && option ? { tier, option } : undefined
  }, [paidPlans, safeCount])

  return { pick, safeCount }
}
