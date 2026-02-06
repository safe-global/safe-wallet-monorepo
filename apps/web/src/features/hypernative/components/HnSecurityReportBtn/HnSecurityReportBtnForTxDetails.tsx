import type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions } from '../withHnBannerConditions'
import { BannerType } from '../../hooks/useBannerStorage'

// Compose the HoCs: Feature check -> Banner conditions check -> Component with TxHash calculation
// The button shows if banner conditions are met (with BannerType.TxReportButton) OR if Hypernative guard is active
// The logic for TxReportButton type is: show if (banner conditions met OR guard is installed)
const HnSecurityReportBtnForTxDetails = withHnFeature(
  withHnBannerConditions<HnSecurityReportBtnWithTxHashProps>(BannerType.TxReportButton)(HnSecurityReportBtnWithTxHash),
)

export default HnSecurityReportBtnForTxDetails
