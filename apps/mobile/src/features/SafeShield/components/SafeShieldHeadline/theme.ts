import { safeShieldStatusColors } from '../../theme'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

// Headline theme
export const safeShieldHeadlineStatusTheme = {
  [`light_safeShieldHeadline_${Severity.OK}`]: {
    background: safeShieldStatusColors.light[Severity.OK].background,
    color: safeShieldStatusColors.light[Severity.OK].color,
  },
  [`light_safeShieldHeadline_${Severity.CRITICAL}`]: {
    background: safeShieldStatusColors.light[Severity.CRITICAL].background,
    color: safeShieldStatusColors.light[Severity.CRITICAL].color,
  },
  [`light_safeShieldHeadline_${Severity.INFO}`]: {
    background: safeShieldStatusColors.light[Severity.INFO].background,
    color: safeShieldStatusColors.light[Severity.INFO].color,
  },
  [`light_safeShieldHeadline_${Severity.WARN}`]: {
    background: safeShieldStatusColors.light[Severity.WARN].background,
    color: safeShieldStatusColors.light[Severity.WARN].color,
  },
  [`dark_safeShieldHeadline_${Severity.OK}`]: {
    background: safeShieldStatusColors.dark[Severity.OK].background,
    color: safeShieldStatusColors.dark[Severity.OK].color,
  },
  [`dark_safeShieldHeadline_${Severity.CRITICAL}`]: {
    background: safeShieldStatusColors.dark[Severity.CRITICAL].background,
    color: safeShieldStatusColors.dark[Severity.CRITICAL].color,
  },
  [`dark_safeShieldHeadline_${Severity.INFO}`]: {
    background: safeShieldStatusColors.dark[Severity.INFO].background,
    color: safeShieldStatusColors.dark[Severity.INFO].color,
  },
  [`dark_safeShieldHeadline_${Severity.WARN}`]: {
    background: safeShieldStatusColors.dark[Severity.WARN].background,
    color: safeShieldStatusColors.dark[Severity.WARN].color,
  },
}
