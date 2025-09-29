import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'

const useIsEarnFeatureEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)
  return useHasFeature(FEATURES.EARN) && !isBlockedCountry
}

export default useIsEarnFeatureEnabled

export const useIsEarnPromoEnabled = () => {
  const featureEnabled = useIsEarnFeatureEnabled()
  return useHasFeature(FEATURES.EARN_PROMO) && featureEnabled
}
