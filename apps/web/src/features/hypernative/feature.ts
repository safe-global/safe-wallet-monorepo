/**
 * Hypernative Feature Implementation - LAZY LOADED
 *
 * This file contains the full feature implementation:
 * - Components (lazy loaded with Suspense)
 * - Hooks
 * - Services
 *
 * It is ONLY loaded when:
 * 1. The feature flag is enabled
 * 2. A consumer calls useLoadFeature(HypernativeFeature)
 *
 * This ensures all Hypernative code is NOT included in the bundle
 * when the feature is disabled.
 */
import type { HypernativeImplementation } from './contract'
import { withSuspense } from '@/features/__core__'
import { lazy } from 'react'

// Type imports for casting lazy components
import type { HnBannerForHistory } from './components/HnBanner/HnBannerForHistory'
import type { HnBannerForQueue } from './components/HnBanner/HnBannerForQueue'
import type { HnBannerForCarousel } from './components/HnBanner/HnBannerForCarousel'
import type { HnBannerForSettings } from './components/HnBanner'
import type { HnLoginCard } from './components/HnLoginCard'
import type HnMiniTxBanner from './components/HnMiniTxBanner'
import type HnPendingBanner from './components/HnPendingBanner'
import type { HnDashboardBannerWithNoBalanceCheck } from './components/HnDashboardBanner'
import type { HnActivatedBannerForSettings } from './components/HnActivatedSettingsBanner'
import type { HypernativeTooltip } from './components/HypernativeTooltip'
import type { HypernativeLogo } from './components/HypernativeLogo'
import type { HnQueueAssessment } from './components/HnQueueAssessment'
import type { HnQueueAssessmentBanner } from './components/HnQueueAssessmentBanner'
import type { QueueAssessmentProvider } from './components/QueueAssessmentProvider'

// Hooks - loaded as part of this chunk
import { useIsHypernativeGuard } from './hooks/useIsHypernativeGuard'
import { useIsHypernativeFeature } from './hooks/useIsHypernativeFeature'
import { useIsHypernativeQueueScanFeature } from './hooks/useIsHypernativeQueueScanFeature'
import { useBannerStorage } from './hooks/useBannerStorage'
import { useBannerVisibility } from './hooks/useBannerVisibility'
import { useTrackBannerEligibilityOnConnect } from './hooks/useTrackBannerEligibilityOnConnect'
import { useAuthToken } from './hooks/useAuthToken'
import { useCalendly } from './hooks/useCalendly'
import { useShowHypernativeAssessment } from './hooks/useShowHypernativeAssessment'
import { useAssessmentUrl } from './hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from './hooks/useHnAssessmentSeverity'
import { useHypernativeOAuth } from './hooks/useHypernativeOAuth'
import { useIsHypernativeEligible } from './hooks/useIsHypernativeEligible'
import { useQueueAssessment } from './hooks/useQueueAssessment'

// Services
import { isHypernativeGuard } from './services/hypernativeGuardCheck'

// Constants
import { hnBannerID } from './components/HnBanner/HnBanner'

const feature: HypernativeImplementation = {
  components: {
    // Lazy load components for code splitting within the feature chunk
    HnBannerForHistory: withSuspense(
      lazy(() => import('./components/HnBanner/HnBannerForHistory').then((m) => ({ default: m.HnBannerForHistory }))),
    ) as typeof HnBannerForHistory,

    HnBannerForQueue: withSuspense(
      lazy(() => import('./components/HnBanner/HnBannerForQueue').then((m) => ({ default: m.HnBannerForQueue }))),
    ) as typeof HnBannerForQueue,

    HnBannerForCarousel: withSuspense(
      lazy(() => import('./components/HnBanner/HnBannerForCarousel').then((m) => ({ default: m.HnBannerForCarousel }))),
    ) as typeof HnBannerForCarousel,

    HnBannerForSettings: withSuspense(
      lazy(() => import('./components/HnBanner').then((m) => ({ default: m.HnBannerForSettings }))),
    ) as typeof HnBannerForSettings,

    HnLoginCard: withSuspense(
      lazy(() => import('./components/HnLoginCard').then((m) => ({ default: m.HnLoginCard }))),
    ) as typeof HnLoginCard,

    HnMiniTxBanner: withSuspense(lazy(() => import('./components/HnMiniTxBanner'))) as typeof HnMiniTxBanner,

    HnPendingBanner: withSuspense(lazy(() => import('./components/HnPendingBanner'))) as typeof HnPendingBanner,

    HnDashboardBannerWithNoBalanceCheck: withSuspense(
      lazy(() =>
        import('./components/HnDashboardBanner').then((m) => ({ default: m.HnDashboardBannerWithNoBalanceCheck })),
      ),
    ) as typeof HnDashboardBannerWithNoBalanceCheck,

    HnActivatedBannerForSettings: withSuspense(
      lazy(() =>
        import('./components/HnActivatedSettingsBanner').then((m) => ({ default: m.HnActivatedBannerForSettings })),
      ),
    ) as typeof HnActivatedBannerForSettings,

    HypernativeTooltip: withSuspense(
      lazy(() => import('./components/HypernativeTooltip').then((m) => ({ default: m.HypernativeTooltip }))),
    ) as typeof HypernativeTooltip,

    HypernativeLogo: withSuspense(
      lazy(() => import('./components/HypernativeLogo').then((m) => ({ default: m.HypernativeLogo }))),
    ) as typeof HypernativeLogo,

    HnQueueAssessment: withSuspense(
      lazy(() => import('./components/HnQueueAssessment').then((m) => ({ default: m.HnQueueAssessment }))),
    ) as typeof HnQueueAssessment,

    HnQueueAssessmentBanner: withSuspense(
      lazy(() => import('./components/HnQueueAssessmentBanner').then((m) => ({ default: m.HnQueueAssessmentBanner }))),
    ) as typeof HnQueueAssessmentBanner,

    QueueAssessmentProvider: withSuspense(
      lazy(() => import('./components/QueueAssessmentProvider').then((m) => ({ default: m.QueueAssessmentProvider }))),
    ) as typeof QueueAssessmentProvider,
  },

  hooks: {
    useIsHypernativeGuard,
    useIsHypernativeFeature,
    useIsHypernativeQueueScanFeature,
    useBannerStorage,
    useBannerVisibility,
    useTrackBannerEligibilityOnConnect,
    useAuthToken,
    useCalendly,
    useShowHypernativeAssessment,
    useAssessmentUrl,
    useHnAssessmentSeverity,
    useHypernativeOAuth,
    useIsHypernativeEligible,
    useQueueAssessment,
  },

  services: {
    isHypernativeGuard,
  },

  hnBannerID,
}

export default feature
