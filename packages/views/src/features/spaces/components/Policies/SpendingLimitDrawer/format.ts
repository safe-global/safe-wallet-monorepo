import { tz } from '@date-fns/tz'
import { format } from 'date-fns'
import type { PolicyAllowance } from '../types'
import { formatTokenAmount, getResetPeriodLabel } from '../utils/policyLabel'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'

const formatUtc = (ms: number, pattern: string): string => format(ms, pattern, { in: tz('UTC') })

const MS_PER_MINUTE = 60_000

/** Takes unix MINUTES, as CGW returns. The reset instant is chain time; the viewer's zone would misstate it. */
export const formatResetUtc = (resetsAtMinute: number): string =>
  `${formatUtc(resetsAtMinute * MS_PER_MINUTE, 'MMM d, HH:mm')} UTC`

const MS_PER_SECOND = 1_000

/** `Jun 24, 2026`. Takes unix SECONDS. */
export const formatUtcDate = (at: number): string => formatUtc(at * MS_PER_SECOND, 'MMM d, yyyy')

/** `Jun 24, 2026 · 03:35 UTC`. Takes unix SECONDS. */
export const formatUtcDateTime = (at: number): string => `${formatUtc(at * MS_PER_SECOND, 'MMM d, yyyy · HH:mm')} UTC`

/** `Jun 24, 2026 · 03:35 UTC`, from the latest allowance (re-)set. `updatedAt` is skipped: spending bumps it too. */
export const formatLastUpdated = (
  spenders: { allowances: Pick<PolicyAllowance, 'createdAt'>[] }[],
): string | undefined => {
  const createdAts = spenders.flatMap(({ allowances }) =>
    allowances.flatMap(({ createdAt }) => (createdAt != null && createdAt > 0 ? [createdAt] : [])),
  )
  if (createdAts.length === 0) return undefined

  return formatUtcDateTime(Math.max(...createdAts))
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

export const formatSignedCount = (signed: number, required: number): string => `${signed} of ${required} signatures`

export const formatAwaitingSignatures = (missing: number): string =>
  `Waiting for ${missing} more signature${missing === 1 ? '' : 's'}`
