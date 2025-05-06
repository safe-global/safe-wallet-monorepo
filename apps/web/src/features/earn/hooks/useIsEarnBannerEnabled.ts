import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsEarnBannerEnabled = () => {
  return useHasFeature(FEATURES.EARN)
}

export default useIsEarnBannerEnabled
