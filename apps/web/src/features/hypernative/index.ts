/**
 * Hypernative Feature - Public API (v3 Architecture)
 *
 * Provides Hypernative security scanning, OAuth authentication,
 * and guard detection for Safe wallets.
 */
import { createFeatureHandle } from '@/features/__core__'
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
export { useIsHypernativeEligible } from './hooks/useIsHypernativeEligible'
export type { HypernativeEligibility } from './hooks/useIsHypernativeEligible'

// OAuth hook and helpers (critical for authentication flow)
export { useHypernativeOAuth, savePkce, readPkce, clearPkce } from './hooks/useHypernativeOAuth'
export type { HypernativeAuthStatus, PkceData } from './hooks/useHypernativeOAuth'

// Guard check hook
export { useIsHypernativeGuard } from './hooks/useIsHypernativeGuard'
export type { HypernativeGuardCheckResult } from './hooks/useIsHypernativeGuard'

// Feature flag hooks
export {
  useIsHypernativeFeature,
  useIsHypernativeFeature as useIsHypernativeFeatureEnabled,
} from './hooks/useIsHypernativeFeature'
export { useIsHypernativeQueueScanFeature } from './hooks/useIsHypernativeQueueScanFeature'

// Assessment-related hooks
export { useHnAssessmentSeverity } from './hooks/useHnAssessmentSeverity'
export { useHnQueueAssessment } from './hooks/useHnQueueAssessment'
export { useHnQueueAssessmentResult } from './hooks/useHnQueueAssessmentResult'
export { useShowHypernativeAssessment } from './hooks/useShowHypernativeAssessment'

// Auth token hook (used by safe-shield context)
export { useAuthToken } from './hooks/useAuthToken'

// Banner visibility hooks (used by dashboard)
export { useBannerVisibility, BannerType } from './hooks/useBannerVisibility'

// Banner components for carousel/settings (used by dashboard, settings pages)
export { HnBannerForCarousel, HnBannerForSettings } from './components/HnBanner'

// Dashboard banner variant (used by FirstSteps)
export { HnDashboardBannerWithNoBalanceCheck } from './components/HnDashboardBanner'

// Queue assessment components (used by TxSummary, queue page)
export { HnQueueAssessment } from './components/HnQueueAssessment'
export { HnQueueAssessmentProvider } from './components/HnQueueAssessmentProvider'

// Header tooltip component (used by sidebar)
export { SafeHeaderHnTooltip } from './components/SafeHeaderHnTooltip'

// Analysis overflow row (used by safe-shield ThreatAnalysis)
export { HnViewMoreOnHypernativeRow } from './components/HnViewMoreOnHypernativeRow'

// Signup flow component (used by spaces SecurityHub)
export { HnSignupFlow } from './components/HnSignupFlow'

// OAuth config (used by oauth-callback page)
export { HYPERNATIVE_OAUTH_CONFIG, getRedirectUri } from './config/oauth'

// ─────────────────────────────────────────────────────────────────
// STORE (direct imports, not lazy-loaded)
// ─────────────────────────────────────────────────────────────────

export * from './store'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

export { HYPERNATIVE_OUTREACH_ID, HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from './constants'
