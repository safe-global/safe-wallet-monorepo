import { formatUtcDayTime, hoursUntil } from '@safe-global/utils/utils/date'

/** `Applies in 24h · Oct 13, 13:02 UTC`. Rounds up, so a change due in under an hour reads `1h`. */
export const formatAppliesAt = (appliesAt: number, nowMs: number): string =>
  `Applies in ${hoursUntil(appliesAt, nowMs)}h · ${formatUtcDayTime(appliesAt)}`
