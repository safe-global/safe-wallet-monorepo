import { Severity } from '@safe-global/utils/features/safe-shield/types'

export const safeShieldStatusTheme = {
  [`light_safeShield_${Severity.OK}`]: {
    background: '#CBF2DB',
    color: '#00B460',
  },
  [`light_safeShield_${Severity.CRITICAL}`]: {
    background: '#FFE0E6',
    color: '#FF5F72',
  },
  [`light_safeShield_${Severity.INFO}`]: {
    background: '#CEF0FD',
    color: '#00BFE5',
  },
  [`light_safeShield_${Severity.WARN}`]: {
    background: '#FFECC2',
    color: '#FF8C00',
  },
  [`dark_safeShield_${Severity.OK}`]: {
    background: '#173026',
    color: '#00B460',
  },
  [`dark_safeShield_${Severity.CRITICAL}`]: {
    background: '#4A2125',
    color: '#FF5F72',
  },
  [`dark_safeShield_${Severity.INFO}`]: {
    background: '#203239',
    color: '#00BFE5',
  },
  [`dark_safeShield_${Severity.WARN}`]: {
    background: '#4A3621',
    color: '#FF8C00',
  },
}
