import type { ComponentType } from 'react'
import { withHnFeature, type WithHnFeatureProps } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnDashboardBanner } from './HnDashboardBanner'

// Export the original component for tests and stories
export { HnDashboardBanner } from './HnDashboardBanner'
export type { HnDashboardBannerProps } from './HnDashboardBanner'

// Export the composed HOC as default for use in Dashboard FirstSteps
// Apply withHnSignupFlow first (inner), then withHnFeature (outer)
const HnDashboardBannerWithSignup = withHnSignupFlow(HnDashboardBanner)
export default withHnFeature(BannerType.Promo)(HnDashboardBannerWithSignup as ComponentType<WithHnFeatureProps>)
