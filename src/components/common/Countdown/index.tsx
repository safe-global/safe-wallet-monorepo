import { Typography, Box } from '@mui/material'
import type { ReactElement } from 'react'

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

export function Countdown({ seconds }: { seconds: number }): ReactElement | null {
  if (seconds <= 0) {
    return null
  }

  if (seconds <= 60) {
    return (
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
        }}
      >
        {'< 1 min'}
      </Typography>
    )
  }

  const { days, hours, minutes } = _getCountdown(seconds)

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
      }}
    >
      <TimeLeft value={days} unit="day" />
      <TimeLeft value={hours} unit="hr" />
      <TimeLeft value={minutes} unit="min" />
    </Box>
  )
}

function TimeLeft({ value, unit }: { value: number; unit: string }): ReactElement | null {
  if (value === 0) {
    return null
  }

  return (
    <div>
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>{' '}
      <Typography
        component="span"
        sx={{
          color: 'primary.light',
        }}
      >
        {value === 1 ? unit : `${unit}s`}
      </Typography>
    </div>
  )
}
