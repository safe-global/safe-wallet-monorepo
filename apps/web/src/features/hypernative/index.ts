/**
 * Hypernative Feature - Public API (v3 Architecture)
 *
 * Provides Hypernative security scanning, OAuth authentication,
 * and guard detection for Safe wallets.
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { HypernativeFeature } from '@/features/hypernative'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const hn = useLoadFeature(HypernativeFeature)
 *   return <hn.HnBanner />
 * }
 *
 * // Hook access via direct import
 * import { useIsHypernativeEligible } from '@/features/hypernative/hooks/useIsHypernativeEligible'
 *
 * function MyComponent() {
 *   const { isHypernativeEligible } = useIsHypernativeEligible()
 * }
 * ```
 */
import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { HypernativeContract } from './contract'

export const HypernativeFeature = createFeatureHandle<HypernativeContract>('hypernative')

export type { HypernativeContract } from './contract'
export type { HypernativeEligibility } from './hooks/useIsHypernativeEligible'
export type { HypernativeAuthStatus, PkceData } from './hooks/useHypernativeOAuth'
export type { HypernativeGuardCheckResult } from './hooks/useIsHypernativeGuard'
