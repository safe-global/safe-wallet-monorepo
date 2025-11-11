export { HnSecurityReportBtn } from './HnSecurityReportBtn'
export { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
export { withGuardCheck } from './withGuardCheck'

import { HnSecurityReportBtnWithTxHash } from './HnSecurityReportBtnWithTxHash'
import { withHnFeature } from '../withHnFeature'
import { withGuardCheck } from './withGuardCheck'

// Compose the HoCs: Feature check -> Guard check -> Component with TxHash calculation
const HnSecurityReportBtnForTxDetails = withHnFeature(withGuardCheck(HnSecurityReportBtnWithTxHash))

export default HnSecurityReportBtnForTxDetails
