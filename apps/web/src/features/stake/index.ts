/**
 * Stake Feature - Public API (v3 Architecture)
 *
 * Provides native staking functionality via Kiln widget integration.
 */
import { createFeatureHandle } from '@/features/__core__'
import type { StakeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components and services)
// ─────────────────────────────────────────────────────────────────

// Feature flag already mapped in createFeatureHandle: stake → FEATURES.STAKING
export const StakeFeature = createFeatureHandle<StakeContract>('stake')

// Contract type
export type { StakeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

// Feature flag hooks
export { default as useIsStakingFeatureEnabled } from './hooks/useIsStakingFeatureEnabled'
export { default as useIsStakingBannerEnabled } from './hooks/useIsStakingBannerEnabled'
export {
  default as useIsStakingPromoBannerVisible,
  STAKING_PROMO_BANNER_HIDE_KEY,
} from './hooks/useIsStakingPromoBannerVisible'

// Stake widget URL hook
export { useGetStakeWidgetUrl } from './hooks/useGetStakeWidgetUrl'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

export * from './constants'

// ─────────────────────────────────────────────────────────────────
// HELPER UTILITIES (direct exports for consumers)
// ─────────────────────────────────────────────────────────────────

export { getStakeTitle } from './helpers/utils'
