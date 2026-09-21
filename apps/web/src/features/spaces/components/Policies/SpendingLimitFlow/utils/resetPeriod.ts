import type { ResetTimeOption } from '@/features/spending-limits/constants'
import { ONE_TIME_HELPER_TEXT } from '../constants'

/** The helper line under Frequency: `1 day` → "Limit resets every day". */
export const describeResetPeriod = (option: ResetTimeOption | undefined): string => {
  if (!option) return ''
  if (option.value === '0') return ONE_TIME_HELPER_TEXT
  return `Limit resets every ${option.label.replace(/^1\s+/, '')}`
}
