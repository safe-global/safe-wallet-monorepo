import type { ComponentType } from 'react'
import { withHnFeature, type WithHnFeatureProps } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnPendingBanner } from './HnPendingBanner'

// Export the original component for tests and stories
export { HnPendingBanner } from './HnPendingBanner'
export type { HnPendingBannerProps } from './HnPendingBanner'

// Export the composed HOC as default
// Apply withHnSignupFlow first (inner), then withHnFeature (outer)
const HnPendingBannerWithSignup = withHnSignupFlow(HnPendingBanner)
export default withHnFeature(BannerType.Pending)(HnPendingBannerWithSignup as ComponentType<WithHnFeatureProps>)
