import { format, formatDistanceToNow, formatRelative } from 'date-fns'
import { maybePlural } from './formatters'

export const currentMinutes = (): number => Math.floor(Date.now() / (1000 * 60))

export const relativeTime = (baseTimeMin: string, resetTimeMin: string): string => {
  if (resetTimeMin === '0') {
    return 'One-time'
  }

  const baseTimeSeconds = +baseTimeMin * 60
  const resetTimeSeconds = +resetTimeMin * 60
  const nextResetTimeMilliseconds = (baseTimeSeconds + resetTimeSeconds) * 1000

  return formatRelative(nextResetTimeMilliseconds, Date.now())
}

export const formatWithSchema = (timestamp: number, schema: string): string => format(timestamp, schema)

export const formatTime = (timestamp: number): string => formatWithSchema(timestamp, 'h:mm a')

export const formatDateTime = (timestamp: number): string => formatWithSchema(timestamp, 'MMM d, yyyy - h:mm:ss a')

export const formatTimeInWords = (timestamp: number): string => formatDistanceToNow(timestamp, { addSuffix: true })

export function getCountdown(seconds: number): { days: number; hours: number; minutes: number } {
  const MINUTE_IN_SECONDS = 60
  const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS
  const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS

  const days = Math.floor(seconds / DAY_IN_SECONDS)

  const remainingSeconds = seconds % DAY_IN_SECONDS
  const hours = Math.floor(remainingSeconds / HOUR_IN_SECONDS)
  const minutes = Math.floor((remainingSeconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS)

  return { days, hours, minutes }
}

export function getPeriod(seconds: number): string | undefined {
  const { days, hours, minutes } = getCountdown(seconds)

  if (days > 0) {
    return `${days} day${maybePlural(days)}`
  }

  if (hours > 0) {
    return `${hours} hour${maybePlural(hours)}`
  }

  if (minutes > 0) {
    return `${minutes} minute${maybePlural(minutes)}`
  }
}
