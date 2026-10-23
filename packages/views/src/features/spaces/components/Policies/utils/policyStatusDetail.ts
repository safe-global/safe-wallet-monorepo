import { formatResetUtc } from '../SpendingLimitDrawer/format'

const SECONDS_PER_HOUR = 3_600

/** `Applies in 24h · Oct 13, 13:02 UTC`. Rounds up, so a change due in under an hour reads `1h`. */
export const formatAppliesAt = (appliesAt: number, nowMs: number): string => {
  const hours = Math.max(1, Math.ceil((appliesAt - nowMs / 1_000) / SECONDS_PER_HOUR))

  return `Applies in ${hours}h · ${formatResetUtc(Math.floor(appliesAt / 60))}`
}
