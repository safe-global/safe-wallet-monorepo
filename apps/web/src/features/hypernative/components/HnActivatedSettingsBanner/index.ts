import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withGuardCheck } from '../HnSecurityReportBtn/withGuardCheck'
import { withOwnerCheck } from '../HnSecurityReportBtn/withOwnerCheck'
import { HnActivatedSettingsBanner } from '@safe-global/views/features/hypernative/components/HnActivatedSettingsBanner/HnActivatedSettingsBanner'

// Export version for Settings page (only shows when guard is active and user is owner)
// Apply withOwnerCheck first (inner, cheaper check), then withGuardCheck, then withHnFeature (outer)
const HnActivatedSettingsBannerWithOwnerCheck = withOwnerCheck(HnActivatedSettingsBanner)
const HnActivatedSettingsBannerWithGuardCheck = withGuardCheck(
  HnActivatedSettingsBannerWithOwnerCheck as ComponentType<object>,
)
export const HnActivatedBannerForSettings = withHnFeature(HnActivatedSettingsBannerWithGuardCheck)
