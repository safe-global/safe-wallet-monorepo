export { HnSecurityReportBtn } from './HnSecurityReportBtn'
export { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
export type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
export { withGuardCheck } from './withGuardCheck'
export { withHnEligibilityCheck as withEligibilityCheck } from './withHnEligibilityCheck'
export { withOwnerCheck } from './withOwnerCheck'

import type { HnSecurityReportBtnWithTxHashProps } from './HnSecurityReportBtnWithTxHash'
import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withHnEligibilityCheck } from './withHnEligibilityCheck'
import { withHnBannerConditions } from '../withHnBannerConditions'
import { BannerType } from '../../hooks/useBannerStorage'

// Compose the HoCs: Feature check -> Eligibility check -> Banner conditions check -> Component with TxHash calculation
// Eligibility allows guard-enabled or targeted Safes; banner conditions still apply for TxReportButton.
const HnSecurityReportBtnForTxDetails = withHnFeature(
  withHnEligibilityCheck(
    withHnBannerConditions<HnSecurityReportBtnWithTxHashProps>(BannerType.TxReportButton)(
      HnSecurityReportBtnWithTxHash,
    ),
  ),
)

export default HnSecurityReportBtnForTxDetails
