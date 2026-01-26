/**
 * Hypernative Feature Contract
 *
 * This file defines the TypeScript interface for the hypernative feature
 * following the feature-architecture-v2 pattern.
 *
 * NOTE: This is a DESIGN DOCUMENT, not executable code.
 * The actual implementation will be in apps/web/src/features/hypernative/contract.ts
 */

import type { FeatureImplementation } from '@/features/__core__'

// =============================================================================
// Type imports for IDE navigation (typeof pattern)
// =============================================================================

// Components
import type { HnBannerForHistory } from './components/HnBanner'
import type { HnBannerForQueue } from './components/HnBanner'
import type { HnBannerForCarousel } from './components/HnBanner'
import type { HnBannerForSettings } from './components/HnBanner'
import type { HnLoginCard } from './components/HnLoginCard'
import type HnMiniTxBanner from './components/HnMiniTxBanner'
import type HnPendingBanner from './components/HnPendingBanner'
import type { HnDashboardBannerWithNoBalanceCheck } from './components/HnDashboardBanner'
import type { HnActivatedBannerForSettings } from './components/HnActivatedSettingsBanner'
import type { HypernativeTooltip } from './components/HypernativeTooltip'
import type HypernativeLogo from './components/HypernativeLogo'
import type { HnQueueAssessment } from './components/HnQueueAssessment'
import type { HnQueueAssessmentBanner } from './components/HnQueueAssessmentBanner'
import type { QueueAssessmentProvider } from './components/QueueAssessmentProvider'

// Hooks
import type { useIsHypernativeGuard } from './hooks/useIsHypernativeGuard'
import type { useIsHypernativeFeature } from './hooks/useIsHypernativeFeature'
import type { useIsHypernativeQueueScanFeature } from './hooks/useIsHypernativeQueueScanFeature'
import type { useBannerStorage } from './hooks/useBannerStorage'
import type { useBannerVisibility } from './hooks/useBannerVisibility'
import type { useTrackBannerEligibilityOnConnect } from './hooks/useTrackBannerEligibilityOnConnect'
import type { useAuthToken } from './hooks/useAuthToken'
import type { useCalendly } from './hooks/useCalendly'
import type { useShowHypernativeAssessment } from './hooks/useShowHypernativeAssessment'
import type { useAssessmentUrl } from './hooks/useAssessmentUrl'
import type { useHnAssessmentSeverity } from './hooks/useHnAssessmentSeverity'
import type { useHypernativeOAuth } from './hooks/useHypernativeOAuth'
import type { useIsHypernativeEligible } from './hooks/useIsHypernativeEligible'
import type { useQueueAssessment } from './hooks/useQueueAssessment'

// Services
import type { isHypernativeGuard } from './services/hypernativeGuardCheck'

// =============================================================================
// Feature Implementation Interface
// =============================================================================

/**
 * Hypernative Feature Implementation - the lazy-loaded part.
 * This is what gets loaded when handle.load() is called.
 */
export interface HypernativeImplementation extends FeatureImplementation {
  components: {
    // Banner variants
    HnBannerForHistory: typeof HnBannerForHistory
    HnBannerForQueue: typeof HnBannerForQueue
    HnBannerForCarousel: typeof HnBannerForCarousel
    HnBannerForSettings: typeof HnBannerForSettings

    // Individual components
    HnLoginCard: typeof HnLoginCard
    HnMiniTxBanner: typeof HnMiniTxBanner
    HnPendingBanner: typeof HnPendingBanner
    HnDashboardBannerWithNoBalanceCheck: typeof HnDashboardBannerWithNoBalanceCheck
    HnActivatedBannerForSettings: typeof HnActivatedBannerForSettings
    HypernativeTooltip: typeof HypernativeTooltip
    HypernativeLogo: typeof HypernativeLogo

    // Queue assessment
    HnQueueAssessment: typeof HnQueueAssessment
    HnQueueAssessmentBanner: typeof HnQueueAssessmentBanner
    QueueAssessmentProvider: typeof QueueAssessmentProvider
  }

  hooks: {
    // Guard detection
    useIsHypernativeGuard: typeof useIsHypernativeGuard

    // Feature flags
    useIsHypernativeFeature: typeof useIsHypernativeFeature
    useIsHypernativeQueueScanFeature: typeof useIsHypernativeQueueScanFeature

    // Banner management
    useBannerStorage: typeof useBannerStorage
    useBannerVisibility: typeof useBannerVisibility
    useTrackBannerEligibilityOnConnect: typeof useTrackBannerEligibilityOnConnect

    // Authentication
    useAuthToken: typeof useAuthToken
    useHypernativeOAuth: typeof useHypernativeOAuth

    // Queue assessment
    useShowHypernativeAssessment: typeof useShowHypernativeAssessment
    useAssessmentUrl: typeof useAssessmentUrl
    useHnAssessmentSeverity: typeof useHnAssessmentSeverity
    useQueueAssessment: typeof useQueueAssessment

    // Eligibility
    useIsHypernativeEligible: typeof useIsHypernativeEligible

    // Signup
    useCalendly: typeof useCalendly
  }

  services: {
    /** Guard contract detection service */
    isHypernativeGuard: typeof isHypernativeGuard
  }
}

// =============================================================================
// Feature Contract Interface
// =============================================================================

/**
 * Hypernative Feature Contract - the full loaded feature type.
 * This is what useLoadFeature(HypernativeFeature) returns when loaded.
 */
export interface HypernativeContract extends HypernativeImplementation {
  readonly name: 'hypernative'
  useIsEnabled: () => boolean | undefined
}

// =============================================================================
// Public Types (re-exported from types.ts)
// =============================================================================

/**
 * OAuth authentication status
 */
export type HypernativeAuthStatus = {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

/**
 * Feature eligibility result
 */
export type HypernativeEligibility = {
  isEligible: boolean
  isLoading: boolean
  hasGuard: boolean
  isAllowlisted: boolean
}

/**
 * Guard detection result
 */
export type HypernativeGuardCheckResult = {
  isHypernativeGuard: boolean
  loading: boolean
}

/**
 * Banner type enum
 */
export enum BannerType {
  SIGNUP = 'signup',
  PENDING = 'pending',
}

/**
 * Banner visibility state
 */
export type BannerVisibilityResult = {
  shouldShowBanner: boolean
  bannerType: BannerType | null
}
