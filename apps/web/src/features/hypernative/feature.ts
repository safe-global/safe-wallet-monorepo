/**
 * Hypernative Feature Implementation - v3 Lazy-Loaded
 *
 * This entire file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * Loaded when:
 * 1. The feature flag FEATURES.HYPERNATIVE is enabled
 * 2. A consumer calls useLoadFeature(HypernativeFeature)
 */
import type { HypernativeContract } from './contract'

// Direct component imports (already lazy-loaded at feature level)
import HnBanner from './components/HnBanner'
import HnDashboardBanner from './components/HnDashboardBanner'
import HnMiniTxBanner from './components/HnMiniTxBanner'
import HnPendingBanner from './components/HnPendingBanner'
import { HnQueueAssessmentBanner } from './components/HnQueueAssessmentBanner'
import { HnActivatedBannerForSettings } from './components/HnActivatedSettingsBanner'
import HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'
import { HnLoginCard } from './components/HnLoginCard'
import HypernativeLogo from './components/HypernativeLogo'
import { HypernativeTooltip } from './components/HypernativeTooltip'
import { HnAnalysisGroupCard } from './components/HnAnalysisGroupCard'
import { HnCustomChecksCard } from './components/HnCustomChecksCard'
import { HnInfoCard } from './components/HnInfoCard'

// Service imports
import { isHypernativeGuard } from './services/hypernativeGuardCheck'

// Flat structure - naming determines stub behavior
const feature: HypernativeContract = {
  // Banner Components
  HnBanner,
  HnDashboardBanner,
  HnMiniTxBanner,
  HnPendingBanner,
  HnQueueAssessmentBanner,

  // Settings Components
  HnActivatedSettingsBanner: HnActivatedBannerForSettings,
  HnSecurityReportBtn,
  HnLoginCard,

  // UI Components
  HypernativeLogo,
  HypernativeTooltip,
  HnAnalysisGroupCard,
  HnCustomChecksCard,
  HnInfoCard,

  // Services
  isHypernativeGuard,
}

export default feature satisfies HypernativeContract
