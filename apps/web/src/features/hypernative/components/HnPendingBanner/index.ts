import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../withHnBannerConditions'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnPendingBannerWithDismissal } from './HnPendingBannerWithDismissal'

// Export the original pure component for tests and stories
export { HnPendingBanner } from './HnPendingBanner'
export type { HnPendingBannerProps } from './HnPendingBanner'

// Export the composed HOC as default
// Apply withHnSignupFlow first (inner), then withHnBannerConditions, then withHnFeature (outer)
const HnPendingBannerWithSignupAndDismissal = withHnSignupFlow(HnPendingBannerWithDismissal)
const HnPendingBannerWithConditions = withHnBannerConditions(BannerType.Pending)(
  HnPendingBannerWithSignupAndDismissal as ComponentType<WithHnBannerConditionsProps>,
)
export default withHnFeature(HnPendingBannerWithConditions)
