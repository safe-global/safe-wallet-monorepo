import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsSafenetChecksEnabled = (): boolean => useHasFeature(FEATURES.SAFENET_CHECKS) === true
