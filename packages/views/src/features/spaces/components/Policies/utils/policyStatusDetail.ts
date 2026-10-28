import { formatResetUtc } from '../SpendingLimitDrawer/format'

const SECONDS_PER_HOUR = 3_600

/** Whole hours left, rounded up and at least 1, so a wait that just started reads `24`. Takes unix SECONDS. */
export const hoursUntil = (at: number, nowMs: number): number =>
  Math.max(1, Math.ceil((at - nowMs / 1_000) / SECONDS_PER_HOUR))

/** `Applies in 24h · Oct 13, 13:02 UTC`. Rounds up, so a change due in under an hour reads `1h`. */
export const formatAppliesAt = (appliesAt: number, nowMs: number): string =>
  `Applies in ${hoursUntil(appliesAt, nowMs)}h · ${formatResetUtc(Math.floor(appliesAt / 60))}`
