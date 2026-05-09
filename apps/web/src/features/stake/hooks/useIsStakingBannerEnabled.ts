import { useHasFeature } from '@/hooks/useChains'
import useIsStakingFeatureEnabled from './useIsStakingFeatureEnabled'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsStakingPromoEnabled = () => {
  const isStakingFeatureEnabled = useIsStakingFeatureEnabled()
  return useHasFeature(FEATURES.STAKING_PROMO) && isStakingFeatureEnabled
}

export default useIsStakingPromoEnabled
