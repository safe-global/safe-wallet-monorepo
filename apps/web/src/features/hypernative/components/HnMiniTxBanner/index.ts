import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../withHnBannerConditions'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnMiniTxBannerWithDismissal } from './HnMiniTxBannerWithDismissal'

// Export the composed HOC as default for use in transaction flows
// Apply withHnSignupFlow first (inner), then withHnBannerConditions, then withHnFeature (outer)
const HnMiniTxBannerWithSignupAndDismissal = withHnSignupFlow(HnMiniTxBannerWithDismissal)
const HnMiniTxBannerWithConditions = withHnBannerConditions(BannerType.Promo)(
  HnMiniTxBannerWithSignupAndDismissal as ComponentType<WithHnBannerConditionsProps>,
)
export default withHnFeature(HnMiniTxBannerWithConditions)
