import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withGuardCheck } from '../HnSecurityReportBtn/withGuardCheck'
import { withOwnerCheck } from '../HnSecurityReportBtn/withOwnerCheck'
import { HnActivatedSettingsBanner } from './HnActivatedSettingsBanner'

// Export the original pure component for tests and stories
export { HnActivatedSettingsBanner } from './HnActivatedSettingsBanner'
export { hnActivatedSettingsBannerConfig } from './config'

// Export version for Settings page (only shows when guard is active and user is owner)
// Apply withOwnerCheck first (inner, cheaper check), then withGuardCheck, then withHnFeature (outer)
const HnActivatedSettingsBannerWithOwnerCheck = withOwnerCheck(HnActivatedSettingsBanner)
const HnActivatedSettingsBannerWithGuardCheck = withGuardCheck(
  HnActivatedSettingsBannerWithOwnerCheck as ComponentType<object>,
)
export const HnActivatedBannerForSettings = withHnFeature(HnActivatedSettingsBannerWithGuardCheck)
