const UTC_DATE = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })

const SECONDS_PER_DAY = 86_400

/** `6 days left · until Oct 21, 2026`. Takes unix SECONDS; an expiry in the past is a closed state, not formatted. */
export const formatTimeToSign = (expiresAt: number, nowMs: number): string => {
  const secondsLeft = expiresAt - nowMs / 1_000
  const until = UTC_DATE.format(new Date(expiresAt * 1_000))
  const days = Math.floor(secondsLeft / SECONDS_PER_DAY)
  const left = days === 0 ? 'Less than a day left' : `${days} day${days === 1 ? '' : 's'} left`

  return `${left} · until ${until}`
}

const SECONDS_PER_HOUR = 3_600
const SECONDS_PER_MINUTE = 60

/** `23h 59m`, at least `1m` so a countdown never reads zero before it is over. */
const formatHoursMinutes = (seconds: number): string => {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  return hours === 0 ? `${Math.max(1, minutes)}m` : `${hours}h ${minutes}m`
}

const secondsUntil = (at: number, nowMs: number): number => Math.max(0, at - nowMs / 1_000)

/** `Apply in 23h 59m`, for the button that stays disabled until the guard's delay is over. Takes unix SECONDS. */
export const formatApplyIn = (appliesAt: number, nowMs: number): string =>
  `Apply in ${formatHoursMinutes(secondsUntil(appliesAt, nowMs))}`

/** `23h 59m left` within the last day, else `6 days left`. Takes unix SECONDS. */
export const formatTimeLeft = (until: number, nowMs: number): string => {
  const secondsLeft = secondsUntil(until, nowMs)
  const days = Math.floor(secondsLeft / SECONDS_PER_DAY)

  return days === 0 ? `${formatHoursMinutes(secondsLeft)} left` : `${days} day${days === 1 ? '' : 's'} left`
}

/** Whole hours left, rounded up, so a wait that just started reads `24`. Takes unix SECONDS. */
export const hoursUntil = (at: number, nowMs: number): number =>
  Math.max(1, Math.ceil(secondsUntil(at, nowMs) / SECONDS_PER_HOUR))

// `hourCycle: 'h23'` rather than `hour12: false`, which renders midnight as 24:00 on some ICU builds.
const UTC_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** `Oct 22, 2026 · 14:30 UTC`. Takes unix SECONDS; the guard's windows are chain time, so UTC. */
export const formatUtcDateTime = (at: number): string => {
  const date = new Date(at * 1_000)

  return `${UTC_DATE.format(date)} · ${UTC_TIME.format(date)} UTC`
}
