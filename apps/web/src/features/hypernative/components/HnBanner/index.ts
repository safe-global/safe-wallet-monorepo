import type { ComponentType } from 'react'
import { withHnFeature, type WithHnFeatureProps } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnBanner } from './HnBanner'

// Export the original component for tests and stories
export { HnBanner, hnBannerID } from './HnBanner'
export type { HnBannerProps } from './HnBanner'

// Export the carousel-compatible version
export { HnBannerForCarousel } from './HnBannerForCarousel'

// Export the composed HOC as default for use in Settings
// Apply withHnSignupFlow first (inner), then withHnFeature (outer)
const HnBannerWithSignup = withHnSignupFlow(HnBanner)
export default withHnFeature(BannerType.Promo)(HnBannerWithSignup as ComponentType<WithHnFeatureProps>)
