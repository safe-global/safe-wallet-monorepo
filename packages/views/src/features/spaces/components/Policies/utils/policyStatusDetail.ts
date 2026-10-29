import { formatTimeUntil, formatUtcDayTime } from '@safe-global/utils/utils/date'

/** `Applies in 9 minutes · Oct 13, 13:02 UTC`. */
export const formatAppliesAt = (appliesAt: number, nowMs: number): string =>
  `Applies in ${formatTimeUntil(appliesAt, nowMs)} · ${formatUtcDayTime(appliesAt)}`
