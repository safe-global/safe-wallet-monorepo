import { Severity } from '@safe-global/utils/features/safe-shield/types'

import { SafeShieldInfo, SafeShieldIssues, SafeShieldOk, SafeShieldWarning } from '../../SafeShieldIcons'

export const safeShieldLogoStatusMap = {
  [Severity.CRITICAL]: SafeShieldIssues,
  [Severity.INFO]: SafeShieldInfo,
  [Severity.WARN]: SafeShieldWarning,
  [Severity.OK]: SafeShieldOk,
  [Severity.ERROR]: SafeShieldWarning,
}
