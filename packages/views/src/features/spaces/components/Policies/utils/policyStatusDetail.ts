import { formatResetUtc, formatSignedCount } from '../SpendingLimitDrawer/format'
import { isAllowlistPolicy, type Policy } from '../types'

const SECONDS_PER_HOUR = 3_600

/** `Applies in 24h · Oct 13, 13:02 UTC`. Rounds up, so a change due in under an hour reads `1h`. */
export const formatAppliesAt = (appliesAt: number, nowMs: number): string => {
  const hours = Math.max(1, Math.ceil((appliesAt - nowMs / 1_000) / SECONDS_PER_HOUR))

  return `Applies in ${hours}h · ${formatResetUtc(Math.floor(appliesAt / 60))}`
}

/** Tells the pending states apart: signatures still missing, ready to execute, or waiting out the delay. */
export const getPendingStatusDetail = (policy: Policy, nowMs = Date.now()): string | undefined => {
  if (isAllowlistPolicy(policy) && policy.status === 'active' && policy.scheduledChange) {
    return formatAppliesAt(policy.scheduledChange.appliesAt, nowMs)
  }
  if (policy.status === 'failed') return 'The transaction failed. Nothing changed on this account.'
  if (policy.status !== 'pending') return undefined

  const { confirmationsSubmitted, confirmationsRequired } = policy

  return confirmationsSubmitted >= confirmationsRequired
    ? 'Ready to execute'
    : formatSignedCount(confirmationsSubmitted, confirmationsRequired)
}
