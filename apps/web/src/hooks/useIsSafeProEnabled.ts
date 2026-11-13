import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/** SAFE_PRO on the current chain; undefined while the chain config loads. */
export const useSafeProFlag = (): boolean | undefined => useHasFeature(FEATURES.SAFE_PRO)

/** SAFE_PRO on the current chain: Safe Pro is live. False while the chain config loads. */
export const useIsSafeProEnabled = (): boolean => useSafeProFlag() === true
