import { getCountdown } from '@safe-global/utils/utils/date'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { formatUtcDate } from '../SpendingLimitDrawer/format'

export { formatUtcDateTime } from '../SpendingLimitDrawer/format'
export { hoursUntil } from '../utils/policyStatusDetail'

const formatDays = (days: number): string => `${days} day${maybePlural(days)}`

/** `6 days left · until Oct 21, 2026`. Takes unix SECONDS; an expiry in the past is a closed state, not formatted. */
export const formatTimeToSign = (expiresAt: number, nowMs: number): string => {
  const { days } = getCountdown(expiresAt - nowMs / 1_000)
  const left = days === 0 ? 'Less than a day left' : `${formatDays(days)} left`

  return `${left} · until ${formatUtcDate(expiresAt)}`
}

/** `23h 59m`, at least `1m` so a countdown never reads zero before it is over. */
const formatHoursMinutes = (seconds: number): string => {
  const { days, hours, minutes } = getCountdown(seconds)
  const totalHours = days * 24 + hours

  return totalHours === 0 ? `${Math.max(1, minutes)}m` : `${totalHours}h ${minutes}m`
}

const secondsUntil = (at: number, nowMs: number): number => Math.max(0, at - nowMs / 1_000)

/** `Apply in 23h 59m`, for the button that stays disabled until the guard's delay is over. Takes unix SECONDS. */
export const formatApplyIn = (appliesAt: number, nowMs: number): string =>
  `Apply in ${formatHoursMinutes(secondsUntil(appliesAt, nowMs))}`

/** `23h 59m left` within the last day, else `6 days left`. Takes unix SECONDS. */
export const formatTimeLeft = (until: number, nowMs: number): string => {
  const secondsLeft = secondsUntil(until, nowMs)
  const { days } = getCountdown(secondsLeft)

  return days === 0 ? `${formatHoursMinutes(secondsLeft)} left` : `${formatDays(days)} left`
}
