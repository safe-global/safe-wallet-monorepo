import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { FEATURES } from '@safe-global/utils/utils/chains'

/** SAFE_PRO_PLANS_V2 on top of a live SAFE_PRO: the Plans page renders its v2 layout. */
export const useIsSafeProPlansV2Enabled = (): boolean => {
  const isSafeProEnabled = useIsSafeProEnabled()
  const isPlansV2Enabled = useHasFeature(FEATURES.SAFE_PRO_PLANS_V2) === true
  return isSafeProEnabled && isPlansV2Enabled
}
