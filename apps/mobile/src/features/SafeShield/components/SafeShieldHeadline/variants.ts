import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldSeverityType, safeShieldIcons } from '../../theme'

const titles: Record<SafeShieldSeverityType, string> = {
  [`safeShield_${Severity.OK}`]: 'Checks passed',
  [`safeShield_${Severity.CRITICAL}`]: 'Risk detected',
  [`safeShield_${Severity.INFO}`]: 'Review details',
  [`safeShield_${Severity.WARN}`]: 'Issues found',
}

export const getSafeShieldHeadlineVariants = (type: SafeShieldSeverityType) => {
  return {
    iconName: safeShieldIcons[type],
    title: titles[type],
  }
}
