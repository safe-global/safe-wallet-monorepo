import type { ComponentType } from 'react'
import { withHnFeature, type WithHnFeatureProps } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnPendingBannerWithDismissal } from './HnPendingBannerWithDismissal'

// Export the original pure component for tests and stories
export { HnPendingBanner } from './HnPendingBanner'
export type { HnPendingBannerProps } from './HnPendingBanner'

// Export the composed HOC as default
// Apply withHnSignupFlow first (inner), then withHnFeature (outer) to the wrapper component
const HnPendingBannerWithSignupAndDismissal = withHnSignupFlow(HnPendingBannerWithDismissal)
export default withHnFeature(BannerType.Pending)(
  HnPendingBannerWithSignupAndDismissal as ComponentType<WithHnFeatureProps>,
)
