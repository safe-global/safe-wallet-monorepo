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
