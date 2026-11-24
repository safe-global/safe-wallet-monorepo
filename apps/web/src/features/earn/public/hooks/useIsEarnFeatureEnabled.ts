import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'

export function useIsEarnFeatureEnabled(): boolean | undefined {
  const isBlockedCountry = useContext(GeoblockingContext)
  const hasFeature = useHasFeature(FEATURES.EARN)

  if (hasFeature === undefined) {
    return undefined
  }

  return hasFeature && !isBlockedCountry
}

export const useIsEarnPromoEnabled = () => {
  const featureEnabled = useIsEarnFeatureEnabled()
  return useHasFeature(FEATURES.EARN_PROMO) && featureEnabled
}
