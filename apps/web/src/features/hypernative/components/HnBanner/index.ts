import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../withHnBannerConditions'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnBannerWithDismissal } from './HnBannerWithDismissal'

// Export the original pure component for tests and stories
export { HnBanner, hnBannerID } from './HnBanner'
export type { HnBannerProps } from './HnBanner'

// Export the carousel-compatible version
export { HnBannerForCarousel } from './HnBannerForCarousel'

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

// Export versions for Queue and History pages (same logic as HnBannerForCarousel)
export { HnBannerForQueue } from './HnBannerForQueue'
export { HnBannerForHistory } from './HnBannerForHistory'
