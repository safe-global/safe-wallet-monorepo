import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { useSpaceOffers } from './billing/useSpaceOffers'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpacePlan } from './useSpacePlan'

export const useSeatUpsell = (spaceId?: string | null) => {
  const currentSpaceId = useCurrentSpaceId()
  const resolvedSpaceId = spaceId === undefined ? currentSpaceId : spaceId
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { seats, tierName } = useSpacePlan(resolvedSpaceId)
  const { paidPlans } = useSpaceOffers(resolvedSpaceId)
  const limit = isSafePro ? (seats?.quota ?? null) : null

  const upgrade =
    limit === null
      ? undefined
      : paidPlans
          .flatMap((plan) => plan.offers)
          .filter((offer) => typeof offer.seats === 'number' && offer.seats > limit)
          .sort((a, b) => (a.seats as number) - (b.seats as number))[0]

  return {
    isSafePro,
    tierName,
    limit,
    upgradePlanName: upgrade?.planName,
    plansHref: resolvedSpaceId
      ? `${AppRoutes.spaces.plans}?spaceId=${encodeURIComponent(resolvedSpaceId)}`
      : AppRoutes.welcome.spaces,
  }
}
