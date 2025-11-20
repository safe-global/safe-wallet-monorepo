import { Severity } from '@safe-global/utils/features/safe-shield/types'

import CriticalLogo from '@/assets/images/safe-shield-issues.png'
import InfoLogo from '@/assets/images/safe-shield-info.png'
import WarnLogo from '@/assets/images/safe-shield-warn.png'
import NeutralLogo from '@/assets/images/safe-shield-neutral.png'
import SuccessLogo from '@/assets/images/safe-shield-success.png'

export const safeShieldLogoStatusMap = {
  [Severity.CRITICAL]: CriticalLogo,
  [Severity.INFO]: InfoLogo,
  [Severity.WARN]: WarnLogo,
  [Severity.OK]: SuccessLogo,
  error: NeutralLogo,
}
