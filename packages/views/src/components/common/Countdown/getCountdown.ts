export function _getCountdown(seconds: number): { days: number; hours: number; minutes: number } {
  const MINUTE_IN_SECONDS = 60
  const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS
  const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS

  const days = Math.floor(seconds / DAY_IN_SECONDS)

  const remainingSeconds = seconds % DAY_IN_SECONDS
  const hours = Math.floor(remainingSeconds / HOUR_IN_SECONDS)
  const minutes = Math.floor((remainingSeconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS)

  return { days, hours, minutes }
}
