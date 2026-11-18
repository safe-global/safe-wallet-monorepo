import type { ComponentType } from 'react'
import { withHnFeature } from '../../components/withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../../components/withHnBannerConditions'
import { withHnSignupFlow } from '../../components/withHnSignupFlow'
import { BannerType } from '../hooks/useBannerStorage'
import { HnDashboardBanner } from '../../components/HnDashboardBanner/HnDashboardBanner'

// Export the original component for tests and stories

export type { HnDashboardBannerProps } from '../../components/HnDashboardBanner/HnDashboardBanner'

// Export the composed HOC as default for use in Dashboard FirstSteps
// Apply withHnSignupFlow first (inner), then withHnBannerConditions, then withHnFeature (outer)
const HnDashboardBannerWithSignup = withHnSignupFlow(HnDashboardBanner)
const HnDashboardBannerWithConditions = withHnBannerConditions(BannerType.Promo)(
  HnDashboardBannerWithSignup as ComponentType<WithHnBannerConditionsProps>,
)
export default withHnFeature(HnDashboardBannerWithConditions)

// Export the composed HOC as default for use in Dashboard FirstSteps
// Apply withHnBannerConditions, then withHnFeature (outer)
export const HnDashboardBannerWithNoBalanceCheck = withHnFeature(
  withHnBannerConditions(BannerType.NoBalanceCheck)(
    HnDashboardBannerWithSignup as ComponentType<WithHnBannerConditionsProps>,
  ),
)
