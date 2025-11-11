export { HnSecurityReportBtn } from './HnSecurityReportBtn'
export { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
export { withGuardCheck } from './withGuardCheck'
export { withOwnerCheck } from './withOwnerCheck'

import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withGuardCheck } from './withGuardCheck'
import { withOwnerCheck } from './withOwnerCheck'

// Compose the HoCs: Feature check -> Owner check -> Guard check -> Component with TxHash calculation
// Owner check comes before guard check to avoid expensive guard hook when user is not an owner
const HnSecurityReportBtnForTxDetails = withHnFeature(withOwnerCheck(withGuardCheck(HnSecurityReportBtnWithTxHash)))

export default HnSecurityReportBtnForTxDetails
