import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/** SAFE_PRO on the current chain: Safe Pro is live. `undefined` while the chain config loads. */
export const useIsSafeProEnabled = (): boolean | undefined => useHasFeature(FEATURES.SAFE_PRO)
