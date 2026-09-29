import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { FEATURES } from '@safe-global/utils/utils/chains'

/** True when both SAFE_PRO and SAFE_PRO_PLANS_V2 are on. */
export const useIsSafeProPlansV2Enabled = (): boolean => {
  const isSafeProEnabled = useIsSafeProEnabled()
  const isPlansV2Enabled = useHasFeature(FEATURES.SAFE_PRO_PLANS_V2) === true
  return isSafeProEnabled && isPlansV2Enabled
}
