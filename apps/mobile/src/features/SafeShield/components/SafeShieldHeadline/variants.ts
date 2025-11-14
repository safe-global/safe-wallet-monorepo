import { IconName } from '@/src/types/iconTypes'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

type SafeShieldHeadlineType = `safeShield_${Severity}`

const icons: Record<SafeShieldHeadlineType, IconName> = {
  [`safeShield_${Severity.OK}`]: 'check',
  [`safeShield_${Severity.CRITICAL}`]: 'alert-triangle',
  [`safeShield_${Severity.INFO}`]: 'info',
  [`safeShield_${Severity.WARN}`]: 'info',
}

const titles: Record<SafeShieldHeadlineType, string> = {
  [`safeShield_${Severity.OK}`]: 'Checks passed',
  [`safeShield_${Severity.CRITICAL}`]: 'Risk detected',
  [`safeShield_${Severity.INFO}`]: 'Review details',
  [`safeShield_${Severity.WARN}`]: 'Issues found',
}

const actionLabels: Record<SafeShieldHeadlineType, string> = {
  [`safeShield_${Severity.OK}`]: 'View & Simulate',
  [`safeShield_${Severity.CRITICAL}`]: 'View',
  [`safeShield_${Severity.INFO}`]: 'View',
  [`safeShield_${Severity.WARN}`]: 'View',
}

export const getSafeShieldHeadlineVariants = (type: SafeShieldHeadlineType) => {
  return {
    iconName: icons[type],
    title: titles[type],
    actionLabel: actionLabels[type],
  }
}
