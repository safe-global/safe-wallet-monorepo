import type { FeatureImplementation } from '@/features/__core__'

// Type imports from implementations - enables IDE jump-to-definition
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

import type { isHypernativeGuard } from './services/hypernativeGuardCheck'

/**
 * Hypernative Feature Implementation - the lazy-loaded part.
 * This is what gets loaded when handle.load() is called.
 */
export interface HypernativeImplementation extends FeatureImplementation {
  components: {
    /** Banner for transaction history page */
    HnBannerForHistory: typeof HnBannerForHistory
    /** Banner for transaction queue page */
    HnBannerForQueue: typeof HnBannerForQueue
    /** Banner for dashboard carousel */
    HnBannerForCarousel: typeof HnBannerForCarousel
    /** Banner for settings page */
    HnBannerForSettings: typeof HnBannerForSettings
    /** Login card for queue page */
    HnLoginCard: typeof HnLoginCard
    /** Mini banner for transaction flows */
    HnMiniTxBanner: typeof HnMiniTxBanner
    /** Pending banner for dashboard */
    HnPendingBanner: typeof HnPendingBanner
    /** Dashboard banner without balance check */
    HnDashboardBannerWithNoBalanceCheck: typeof HnDashboardBannerWithNoBalanceCheck
    /** Activated banner for settings */
    HnActivatedBannerForSettings: typeof HnActivatedBannerForSettings
    /** Tooltip component for hypernative info */
    HypernativeTooltip: typeof HypernativeTooltip
    /** Hypernative logo component */
    HypernativeLogo: typeof HypernativeLogo
    /** Queue assessment display component */
    HnQueueAssessment: typeof HnQueueAssessment
    /** Queue assessment banner component */
    HnQueueAssessmentBanner: typeof HnQueueAssessmentBanner
    /** Provider for queue assessment context */
    QueueAssessmentProvider: typeof QueueAssessmentProvider
  }

  hooks: {
    /** Check if current safe has hypernative guard installed */
    useIsHypernativeGuard: typeof useIsHypernativeGuard
    /** Check if hypernative feature is enabled */
    useIsHypernativeFeature: typeof useIsHypernativeFeature
    /** Check if queue scan feature is enabled */
    useIsHypernativeQueueScanFeature: typeof useIsHypernativeQueueScanFeature
    /** Manage banner storage state */
    useBannerStorage: typeof useBannerStorage
    /** Check banner visibility conditions */
    useBannerVisibility: typeof useBannerVisibility
    /** Track banner eligibility on wallet connect */
    useTrackBannerEligibilityOnConnect: typeof useTrackBannerEligibilityOnConnect
    /** Get authentication token state */
    useAuthToken: typeof useAuthToken
    /** Calendly integration hook */
    useCalendly: typeof useCalendly
    /** Check if hypernative assessment should be shown */
    useShowHypernativeAssessment: typeof useShowHypernativeAssessment
    /** Get assessment URL */
    useAssessmentUrl: typeof useAssessmentUrl
    /** Get assessment severity */
    useHnAssessmentSeverity: typeof useHnAssessmentSeverity
    /** OAuth authentication hook */
    useHypernativeOAuth: typeof useHypernativeOAuth
    /** Check hypernative eligibility */
    useIsHypernativeEligible: typeof useIsHypernativeEligible
    /** Get queue assessment for a transaction */
    useQueueAssessment: typeof useQueueAssessment
  }

  services: {
    /** Check if an address is a hypernative guard contract */
    isHypernativeGuard: typeof isHypernativeGuard
  }

  /** Banner ID for carousel integration */
  hnBannerID: string
}

/**
 * Hypernative Feature Contract - the full loaded feature type.
 * This is what useLoadFeature(HypernativeFeature) returns when loaded.
 */
export interface HypernativeContract extends HypernativeImplementation {
  readonly name: 'hypernative'
  useIsEnabled: () => boolean | undefined
}
