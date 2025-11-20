import { IconName } from '@/src/types/iconTypes'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

export type SafeShieldSeverityType = `safeShield_${Severity}`
export type SafeShieldAnalysisStatusType = `safeShieldAnalysisStatus_${Severity}`

export const safeShieldIcons: Record<SafeShieldSeverityType, IconName> = {
  [`safeShield_${Severity.OK}`]: 'check',
  [`safeShield_${Severity.CRITICAL}`]: 'alert-triangle',
  [`safeShield_${Severity.INFO}`]: 'info',
  [`safeShield_${Severity.WARN}`]: 'info',
}

// Centralized colors for SafeShield theme by severity and mode
export const safeShieldStatusColors = {
  light: {
    [Severity.OK]: {
      background: '#CBF2DB',
      color: '#00B460',
    },
    [Severity.CRITICAL]: {
      background: '#FFE0E6',
      color: '#FF5F72',
    },
    [Severity.INFO]: {
      background: '#CEF0FD',
      color: '#00BFE5',
    },
    [Severity.WARN]: {
      background: '#FFECC2',
      color: '#FF8C00',
    },
  },
  dark: {
    [Severity.OK]: {
      background: '#173026',
      color: '#00B460',
    },
    [Severity.CRITICAL]: {
      background: '#4A2125',
      color: '#FF5F72',
    },
    [Severity.INFO]: {
      background: '#203239',
      color: '#00BFE5',
    },
    [Severity.WARN]: {
      background: '#4A3621',
      color: '#FF8C00',
    },
  },
}

// Analysis status theme (can have different prop names if needed)
export const safeShieldAnalysisStatusTheme = {
  [`light_safeShieldAnalysisStatus_${Severity.OK}`]: {
    icon: safeShieldStatusColors.light[Severity.OK].color,
  },
  [`light_safeShieldAnalysisStatus_${Severity.CRITICAL}`]: {
    icon: safeShieldStatusColors.light[Severity.CRITICAL].color,
  },
  [`light_safeShieldAnalysisStatus_${Severity.INFO}`]: {
    icon: safeShieldStatusColors.light[Severity.INFO].color,
  },
  [`light_safeShieldAnalysisStatus_${Severity.WARN}`]: {
    icon: safeShieldStatusColors.light[Severity.WARN].color,
  },
  [`dark_safeShieldAnalysisStatus_${Severity.OK}`]: {
    icon: safeShieldStatusColors.dark[Severity.OK].color,
  },
  [`dark_safeShieldAnalysisStatus_${Severity.CRITICAL}`]: {
    icon: safeShieldStatusColors.dark[Severity.CRITICAL].color,
  },
  [`dark_safeShieldAnalysisStatus_${Severity.INFO}`]: {
    icon: safeShieldStatusColors.dark[Severity.INFO].color,
  },
  [`dark_safeShieldAnalysisStatus_${Severity.WARN}`]: {
    icon: safeShieldStatusColors.dark[Severity.WARN].color,
  },
}
