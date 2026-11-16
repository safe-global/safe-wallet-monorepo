/**
 * Swap Feature - Public API (v3 Architecture)
 *
 * Provides native swap functionality via CoW Protocol integration.
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { SwapFeature } from '@/features/swap'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const swap = useLoadFeature(SwapFeature)
 *   return <swap.SwapWidget />
 * }
 *
 * // Hook access via direct import
 * import { useIsSwapFeatureEnabled } from '@/features/swap'
 *
 * function MyComponent() {
 *   const isEnabled = useIsSwapFeatureEnabled()
 * }
 * ```
 */
import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SwapContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components and services)
// ─────────────────────────────────────────────────────────────────

// Feature flag already mapped in createFeatureHandle: swap → FEATURES.NATIVE_SWAPS
export const SwapFeature = createFeatureHandle<SwapContract>('swap')

// Contract type
export type { SwapContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

// Feature flag hook

// Swap state hooks

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// HELPER UTILITIES (direct exports for consumers)
// ─────────────────────────────────────────────────────────────────
