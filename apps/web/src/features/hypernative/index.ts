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
 * import { useIsHypernativeEligible } from '@/features/hypernative'
 *
 * function MyComponent() {
 *   const { isHypernativeEligible } = useIsHypernativeEligible()
 * }
 * ```
 */
import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { HypernativeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components and services)
// ─────────────────────────────────────────────────────────────────

export const HypernativeFeature = createFeatureHandle<HypernativeContract>('hypernative')

// Contract type
export type { HypernativeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

// Eligibility hook (critical for safe-shield integration)

export type { HypernativeEligibility } from './hooks/useIsHypernativeEligible'

// OAuth hook and helpers (critical for authentication flow)

export type { HypernativeAuthStatus, PkceData } from './hooks/useHypernativeOAuth'

// Guard check hook

export type { HypernativeGuardCheckResult } from './hooks/useIsHypernativeGuard'

// Feature flag hooks

// Assessment-related hooks

// Auth token hook (used by safe-shield context)

// Token refresh loop (mounted once in the app root)

// Banner visibility hooks (used by dashboard)

// Banner components for carousel/settings (used by dashboard, settings pages)
export { HnBannerForCarousel } from '@/features/hypernative/components/HnBanner/HnBannerForCarousel'
export { HnBannerForSettings } from './components/HnBanner'

// Dashboard banner variant (used by FirstSteps)
export { HnDashboardBannerWithNoBalanceCheck } from './components/HnDashboardBanner'

// Queue assessment components (used by TxSummary, queue page)
export { HnQueueAssessment } from '@/features/hypernative/components/HnQueueAssessment/HnQueueAssessment'
export { HnQueueAssessmentProvider } from '@/features/hypernative/components/HnQueueAssessmentProvider/HnQueueAssessmentProvider'

// Header tooltip component (used by sidebar)
export { SafeHeaderHnTooltip } from '@/features/hypernative/components/SafeHeaderHnTooltip/SafeHeaderHnTooltip'

// Analysis overflow row (used by safe-shield ThreatAnalysis)

// Signup flow component (used by spaces SecurityHub)
export { default as HnSignupFlow } from '@/features/hypernative/components/HnSignupFlow/HnSignupFlow'

// OAuth config (used by oauth-callback page)

// ─────────────────────────────────────────────────────────────────
// STORE (direct imports, not lazy-loaded)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
