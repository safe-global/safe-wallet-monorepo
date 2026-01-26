/**
 * Hypernative Feature - Public Types
 *
 * These types are available for compile-time use without runtime cost.
 * Import them using `import type { ... } from '@/features/hypernative'`
 */

// OAuth and authentication types
export type { HypernativeAuthStatus, PkceData } from './hooks/useHypernativeOAuth'

// Eligibility types
export type { HypernativeEligibility } from './hooks/useIsHypernativeEligible'

// Guard check types
export type { HypernativeGuardCheckResult } from './hooks/useIsHypernativeGuard'

// Banner types
export { BannerType } from './hooks/useBannerStorage'
export type { BannerVisibilityResult } from './hooks/useBannerVisibility'
