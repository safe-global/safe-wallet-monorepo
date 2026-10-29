import { format, formatDistanceToNow, formatDuration, formatRelative, minutesToMilliseconds } from 'date-fns'
import { secondsInDay, secondsInHour, secondsInMinute } from 'date-fns/constants'

export const currentMinutes = (): number => Math.floor(Date.now() / (1000 * 60))

export const relativeTime = (baseTimeMin: string, resetTimeMin: string): string => {
  if (resetTimeMin === '0') {
    return 'One-time'
  }

  return formatRelative(minutesToMilliseconds(+baseTimeMin + +resetTimeMin), Date.now())
}

export const formatWithSchema = (timestamp: number, schema: string): string => format(timestamp, schema)

export const formatDate = (timestamp: number): string => formatWithSchema(timestamp, 'MMM d, yyyy')

export const parseTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export const formatTime = (timestamp: number): string => formatWithSchema(timestamp, 'h:mm a')

export const formatDateTime = (timestamp: number): string => formatWithSchema(timestamp, 'MMM d, yyyy - h:mm:ss a')

export const formatTimeInWords = (timestamp: number): string => formatDistanceToNow(timestamp, { addSuffix: true })

export function getCountdown(seconds: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(seconds / secondsInDay)

  const remainingSeconds = seconds % secondsInDay
  const hours = Math.floor(remainingSeconds / secondsInHour)
  const minutes = Math.floor((remainingSeconds % secondsInHour) / secondsInMinute)

  return { days, hours, minutes }
}

export function getPeriod(seconds: number): string | undefined {
  const { days, hours, minutes } = getCountdown(seconds)

  if (days > 0) {
    return formatDuration({ days })
  }

  if (hours > 0) {
    return formatDuration({ hours })
  }

  if (minutes > 0) {
    return formatDuration({ minutes })
  }
}

export function getDetailedPeriod(seconds: number): string {
  // formatDuration would write out negative and NaN units
  if (!(seconds > 0)) return ''

  const { days, hours, minutes } = getCountdown(seconds)

  return formatDuration({ days, hours, minutes, seconds: seconds % secondsInMinute }, { delimiter: ', ' })
}
