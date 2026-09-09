/**
 * Stake Feature - Public API (v3 Architecture)
 *
 * Provides native staking functionality via Kiln widget integration.
 */
import { createFeatureHandle } from '@/features/__core__'
import type { StakeContract } from './contract'

// Feature flag already mapped in createFeatureHandle: stake → FEATURES.STAKING
export const StakeFeature = createFeatureHandle<StakeContract>('stake')

// Contract type
export type { StakeContract } from './contract'

// Feature flag hooks
export { default as useIsStakingFeatureEnabled } from './hooks/useIsStakingFeatureEnabled'
export { default as useIsStakingBannerEnabled } from './hooks/useIsStakingBannerEnabled'
export {
  default as useIsStakingPromoBannerVisible,
  STAKING_PROMO_BANNER_HIDE_KEY,
} from './hooks/useIsStakingPromoBannerVisible'

// Stake widget URL hook
export { useGetStakeWidgetUrl } from './hooks/useGetStakeWidgetUrl'

export * from './constants'

export { getStakeTitle } from './helpers/utils'
