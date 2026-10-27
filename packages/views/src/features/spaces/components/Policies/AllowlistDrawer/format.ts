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

/** `Apply in 23h 59m`, for the button that stays disabled until the guard's delay is over. Takes unix SECONDS. */
export const formatApplyIn = (appliesAt: number, nowMs: number): string => {
  const secondsLeft = Math.max(0, appliesAt - nowMs / 1_000)
  const hours = Math.floor(secondsLeft / SECONDS_PER_HOUR)
  const minutes = Math.ceil((secondsLeft % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  return hours === 0 ? `Apply in ${Math.max(1, minutes)}m` : `Apply in ${hours}h ${minutes}m`
}

/** `6 days left · apply by Oct 20, 2026`. Takes unix SECONDS. */
export const formatApplyBy = (expiresAt: number, nowMs: number): string =>
  formatTimeToSign(expiresAt, nowMs).replace('· until', '· apply by')
