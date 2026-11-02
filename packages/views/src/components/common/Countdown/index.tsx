import type { ReactElement } from 'react'
import { getCountdown } from '@safe-global/utils/utils/date'

export function Countdown({ seconds }: { seconds: number }): ReactElement | null {
  if (seconds <= 0) {
    return null
  }

  if (seconds <= 60) {
    return <span className="font-bold">{'< 1 min'}</span>
  }

  const { days, hours, minutes } = getCountdown(seconds)

  return (
    <div className="flex gap-2">
      <TimeLeft value={days} unit="day" />
      <TimeLeft value={hours} unit="hr" />
      <TimeLeft value={minutes} unit="min" />
    </div>
  )
}

function TimeLeft({ value, unit }: { value: number; unit: string }): ReactElement | null {
  if (value === 0) {
    return null
  }

  return (
    <div>
      <span className="font-bold">{value}</span>{' '}
      <span className="text-[var(--color-primary-light)]">{value === 1 ? unit : `${unit}s`}</span>
    </div>
  )
}
