/**
 * Hypernative Feature - Public API
 *
 * This feature provides Hypernative integration for Safe wallets,
 * including guard detection, OAuth authentication, and promotional banners.
 *
 * ## Usage
 *
 * ```typescript
 * import { HypernativeFeature } from '@/features/hypernative'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const hypernative = useLoadFeature(HypernativeFeature)
 *   if (!hypernative) return null
 *   return <hypernative.components.HnBannerForHistory />
 * }
 * ```
 *
 * All feature functionality (components, hooks, services) is accessed via
 * the loaded feature object from useLoadFeature(). This ensures proper
 * lazy loading and code splitting.
 */

import { createFeatureHandle } from '@/features/__core__'
import type { HypernativeImplementation } from './contract'

// Feature handle - uses semantic mapping (hypernative → FEATURES.HYPERNATIVE)
export const HypernativeFeature = createFeatureHandle<HypernativeImplementation>('hypernative')

// Contract type (for type-safe feature access)
export type { HypernativeContract, HypernativeImplementation } from './contract'

// Public types (compile-time only, no runtime cost)
export type {
  HypernativeAuthStatus,
  PkceData,
  HypernativeEligibility,
  HypernativeGuardCheckResult,
  BannerVisibilityResult,
} from './types'
export { BannerType } from './types'

// Lightweight OAuth utilities (synchronous, no heavy imports)
// These are needed by the OAuth callback page for synchronous access
export { readPkce, clearPkce } from './hooks/useHypernativeOAuth'
export { HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from './config/oauth'
