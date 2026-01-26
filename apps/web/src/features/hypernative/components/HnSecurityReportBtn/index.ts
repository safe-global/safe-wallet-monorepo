export { HnSecurityReportBtn } from './HnSecurityReportBtn'
export { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
export type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
export { withGuardCheck } from './withGuardCheck'
export { withOwnerCheck } from './withOwnerCheck'

import type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions } from '../withHnBannerConditions'
import { BannerType } from '../../hooks/useBannerStorage'

const HnSecurityReportBtnForTxDetails = withHnFeature(
  withHnBannerConditions<HnSecurityReportBtnWithTxHashProps>(BannerType.TxReportButton)(HnSecurityReportBtnWithTxHash),
)

export default HnSecurityReportBtnForTxDetails
