/**
 * Every time the panel renders names its timezone. Readers are in many timezones, and a spending
 * limit that resets at a stated time is only checkable if the reader knows which zone it is in.
 */

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
}

const RESET_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
}

/** For example `06.24.26 03:35 AM UTC`. */
export const formatPolicyDateTime = (unixSeconds: number): string => {
  const formatted = new Intl.DateTimeFormat('en-US', DATE_TIME_FORMAT)
    .format(new Date(unixSeconds * 1000))
    .replace(/\//g, '.')
    .replace(',', '')

  return `${formatted} UTC`
}

/** For example `Resets Oct 1, 00:00 UTC`. */
export const formatResetTime = (unixSeconds: number): string =>
  `Resets ${new Intl.DateTimeFormat('en-US', RESET_FORMAT).format(new Date(unixSeconds * 1000))} UTC`
