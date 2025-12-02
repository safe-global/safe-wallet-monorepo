import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsNoFeeCampaignEnabled = () => {
  return useHasFeature(FEATURES.NO_FEE_NOVEMBER)
}

export default useIsNoFeeCampaignEnabled
