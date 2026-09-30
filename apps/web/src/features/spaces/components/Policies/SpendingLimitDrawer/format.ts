import type { PolicyAllowance } from '../types'
import { formatTokenAmount, getResetPeriodLabel } from '../utils/policyLabel'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

// `hourCycle: 'h23'` rather than `hour12: false`, which renders midnight as 24:00 on some ICU builds.
const UTC_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const MS_PER_MINUTE = 60_000

/** Takes unix MINUTES, as CGW returns. The reset instant is chain time; the viewer's zone would misstate it. */
export const formatResetUtc = (resetsAtMinute: number): string => {
  const parts = UTC_PARTS.formatToParts(new Date(resetsAtMinute * MS_PER_MINUTE))
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? ''

  return `${part('month')} ${part('day')}, ${part('hour')}:${part('minute')} UTC`
}

const PERCENT_SCALE = 10_000n

/** The bar fills with what is left to spend, so a full bar reads as untouched headroom. */
export const remainingPercent = (allowance: Pick<PolicyAllowance, 'amount' | 'remaining'>): number => {
  const amount = BigInt(allowance.amount)
  if (amount === 0n) return 0

  const scaled = Number((BigInt(allowance.remaining) * PERCENT_SCALE) / amount) / 100

  return Math.min(100, Math.max(0, scaled))
}

/** `1,500/month`. The symbol lives in the icon column, so it is not repeated here. */
export const formatAllowanceAmount = (allowance: PolicyAllowance): string => {
  const amount = formatVisualAmount(allowance.amount, allowance.token.decimals)

  return allowance.resetPeriodMinutes === 0
    ? `${amount} one time`
    : `${amount}/${getResetPeriodLabel(allowance.resetPeriodMinutes)}`
}

export const formatRemaining = (allowance: PolicyAllowance): string =>
  `${formatTokenAmount(allowance.remaining, allowance.token)} remaining`

export const formatSignedCount = (signed: number, required: number): string => `${signed} of ${required} signed`

export const formatAwaitingSignatures = (missing: number): string =>
  `Waiting for ${missing} more signature${missing === 1 ? '' : 's'}`
