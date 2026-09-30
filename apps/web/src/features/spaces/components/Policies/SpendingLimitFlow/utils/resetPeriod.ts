import { getResetTimeOptions } from '@/features/spending-limits'
import type { ResetTimeOption } from '@/features/spending-limits/constants'
import { ONE_TIME_HELPER_TEXT } from '../constants'

/** The helper line under Frequency: `1 day` → "Limit resets every day". */
export const describeResetPeriod = (option: ResetTimeOption | undefined): string => {
  if (!option) return ''
  if (option.value === '0') return ONE_TIME_HELPER_TEXT
  return `Limit resets every ${option.label.replace(/^1\s+/, '')}`
}

/** What the Safe-level review reports for a one-time limit; identical here so both surfaces compare in analytics. */
const ONE_TIME_EVENT_LABEL = 'One-time spending limit'

/** The analytics label for a limit's period: `'0'` is one time, anything else is the dropdown's label (`1 week`). */
export const resetPeriodEventLabel = (resetTimeMin: string, chainId: string): string => {
  if (resetTimeMin === '0') return ONE_TIME_EVENT_LABEL
  const option = getResetTimeOptions(chainId).find((candidate) => candidate.value === resetTimeMin)
  return option?.label ?? `${resetTimeMin} minutes`
}
