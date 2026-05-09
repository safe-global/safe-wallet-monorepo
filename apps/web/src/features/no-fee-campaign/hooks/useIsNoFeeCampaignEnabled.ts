import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsNoFeeCampaignEnabled() {
  return useHasFeature(FEATURES.NO_FEE_NOVEMBER)
}
