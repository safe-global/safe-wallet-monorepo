import type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions } from '../withHnBannerConditions'
import { BannerType } from '../../hooks/useBannerStorage'

// HoCs: feature check → banner-conditions check → component with TxHash. Shows when the TxReportButton
// banner conditions are met OR the Hypernative guard is installed.
const HnSecurityReportBtnForTxDetails = withHnFeature(
  withHnBannerConditions<HnSecurityReportBtnWithTxHashProps>(BannerType.TxReportButton)(HnSecurityReportBtnWithTxHash),
)

export default HnSecurityReportBtnForTxDetails
