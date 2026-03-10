/**
 * Hypernative Feature Contract - v3 Architecture
 *
 * Defines the public API surface for lazy-loaded components and services.
 * Accessed via useLoadFeature(HypernativeFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 * - camelCase → Service (undefined when not ready, check $isReady before calling)
 *
 * IMPORTANT: Hooks are NOT in the contract - exported directly from index.ts
 */

import type HnBanner from './components/HnBanner'
import type HnDashboardBanner from './components/HnDashboardBanner'
import type HnMiniTxBanner from './components/HnMiniTxBanner'
import type HnPendingBanner from './components/HnPendingBanner'
import type { HnQueueAssessmentBanner } from './components/HnQueueAssessmentBanner'
import type { HnActivatedBannerForSettings } from './components/HnActivatedSettingsBanner'
import type HnSecurityReportBtn from './components/HnSecurityReportBtn/HnSecurityReportBtn'
import type HnSecuritySection from './components/HnSecuritySection'
import type { HnLoginCard } from './components/HnLoginCard'
import type HypernativeLogo from './components/HypernativeLogo'
import type { HypernativeTooltip } from './components/HypernativeTooltip'
import type { SafeHeaderHnTooltip } from './components/SafeHeaderHnTooltip'
import type { HnAnalysisGroupCard } from './components/HnAnalysisGroupCard'
import type { HnCustomChecksCard } from './components/HnCustomChecksCard'
import type { HnInfoCard } from './components/HnInfoCard'
import type { isHypernativeGuard } from './services/hypernativeGuardCheck'
import type { HnQueueAssessment } from './components/HnQueueAssessment'

export interface HypernativeContract {
  // Banner Components (PascalCase → stub renders null)
  HnBanner: typeof HnBanner
  HnDashboardBanner: typeof HnDashboardBanner
  HnMiniTxBanner: typeof HnMiniTxBanner
  HnPendingBanner: typeof HnPendingBanner
  HnQueueAssessmentBanner: typeof HnQueueAssessmentBanner
  HnQueueAssessment: typeof HnQueueAssessment

  // Settings Components (PascalCase → stub renders null)
  HnActivatedSettingsBanner: typeof HnActivatedBannerForSettings
  HnSecurityReportBtn: typeof HnSecurityReportBtn
  HnSecuritySection: typeof HnSecuritySection
  HnLoginCard: typeof HnLoginCard

  // UI Components (PascalCase → stub renders null)
  HypernativeLogo: typeof HypernativeLogo
  HypernativeTooltip: typeof HypernativeTooltip
  SafeHeaderHnTooltip: typeof SafeHeaderHnTooltip
  HnAnalysisGroupCard: typeof HnAnalysisGroupCard
  HnCustomChecksCard: typeof HnCustomChecksCard
  HnInfoCard: typeof HnInfoCard

  // Services (camelCase → undefined when not ready)
  isHypernativeGuard: typeof isHypernativeGuard
}
