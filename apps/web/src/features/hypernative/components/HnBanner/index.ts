import type { ComponentType } from 'react'
import { withHnFeature, type WithHnFeatureProps } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnBannerWithDismissal } from './HnBannerWithDismissal'

// Export the original pure component for tests and stories
export { HnBanner, hnBannerID } from './HnBanner'
export type { HnBannerProps } from './HnBanner'

// Export the carousel-compatible version
export { HnBannerForCarousel } from './HnBannerForCarousel'

// Export the composed HOC as default for use in Settings
// Apply withHnSignupFlow first (inner), then withHnFeature (outer) to the wrapper component
const HnBannerWithSignupAndDismissal = withHnSignupFlow(HnBannerWithDismissal)
export default withHnFeature(BannerType.Promo)(HnBannerWithSignupAndDismissal as ComponentType<WithHnFeatureProps>)
