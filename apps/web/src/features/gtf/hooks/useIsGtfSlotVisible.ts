import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsGtfSlotVisible = (): boolean => !!useHasFeature(FEATURES.GTF)
