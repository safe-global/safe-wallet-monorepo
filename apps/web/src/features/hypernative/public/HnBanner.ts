import type { ComponentType } from 'react'
import { withHnFeature } from '../components/withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../components/withHnBannerConditions'
import { withHnSignupFlow } from '../components/withHnSignupFlow'
import { BannerType } from './useBannerStorage'
import { HnBannerWithDismissal } from '../components/HnBanner/HnBannerWithDismissal'

// Export the original pure component for tests and stories

export type { HnBannerProps } from '../components/HnBanner/HnBanner'

// Export the carousel-compatible version

// Export the composed HOC as default for use in Carousel (uses Promo banner type)
// Apply withHnSignupFlow first (inner), then withHnBannerConditions, then withHnFeature (outer)
const HnBannerWithSignupAndDismissal = withHnSignupFlow(HnBannerWithDismissal)
const HnBannerWithConditions = withHnBannerConditions(BannerType.Promo)(
  HnBannerWithSignupAndDismissal as ComponentType<WithHnBannerConditionsProps>,
)
export default withHnFeature(HnBannerWithConditions)

// Export version for Settings page (uses Settings banner type, ignores dismissal state)
const HnBannerForSettingsWithConditions = withHnBannerConditions(BannerType.Settings)(
  HnBannerWithSignupAndDismissal as ComponentType<WithHnBannerConditionsProps>,
)
export const HnBannerForSettings = withHnFeature(HnBannerForSettingsWithConditions)
