/**
 * Stake Feature - Public API (v3 Architecture)
 *
 * Provides native staking functionality via Kiln widget integration.
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { StakeFeature } from '@/features/stake'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const stake = useLoadFeature(StakeFeature)
 *   return <stake.StakingWidget />
 * }
 *
 * // Hook access via direct import
 * import { useIsStakingFeatureEnabled } from '@/features/stake'
 *
 * function MyComponent() {
 *   const isEnabled = useIsStakingFeatureEnabled()
 * }
 * ```
 */
import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
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

// Stake widget URL hook

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// HELPER UTILITIES (direct exports for consumers)
// ─────────────────────────────────────────────────────────────────
