import { useHasFeature } from '@/hooks/useChains'
import useIsStakingFeatureEnabled from './useIsStakingFeatureEnabled'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsStakingBannerEnabled = () => {
  const isStakingFeatureEnabled = useIsStakingFeatureEnabled()
  return useHasFeature(FEATURES.STAKING_BANNER) && isStakingFeatureEnabled
}

export default useIsStakingBannerEnabled
