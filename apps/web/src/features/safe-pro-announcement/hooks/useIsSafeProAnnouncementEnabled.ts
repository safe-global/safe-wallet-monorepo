import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsSafeProAnnouncementEnabled = (): boolean => useHasFeature(FEATURES.SAFE_PRO_ANNOUNCEMENT) === true
