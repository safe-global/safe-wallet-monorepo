import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

// Gauge arc spans 270° with a 90° gap centered at the bottom. The SVG is rotated 135°
// so the dash (which natively starts at 3 o'clock and sweeps clockwise) begins at the
// bottom-left and ends at the bottom-right, leaving the gap open at the bottom.
const GAUGE_SIZE = 100
const GAUGE_THICKNESS = 6
const GAUGE_ARC_FRACTION = 0.75

// Converts a MUI palette token path (e.g. "success.main") to its theme CSS var (vars.css),
// so it can be used as an SVG stroke. Plain colors (no dot) are returned untouched.
const tokenToCssVar = (token: string): string =>
  token.includes('.') ? `var(--color-${token.replace(/\./g, '-')})` : token

export const ScoreGauge = ({ scorePct, color }: { scorePct: number; color: string }): ReactElement => {
  const radius = (GAUGE_SIZE - GAUGE_THICKNESS) / 2
  const circumference = 2 * Math.PI * radius
  const trackLength = circumference * GAUGE_ARC_FRACTION
  const progressLength = trackLength * (Math.min(Math.max(scorePct, 0), 100) / 100)

  return (
    <div className="relative inline-flex shrink-0">
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="origin-center rotate-[135deg]"
      >
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={radius}
          fill="none"
          stroke={tokenToCssVar('border.light')}
          strokeWidth={GAUGE_THICKNESS}
          strokeLinecap="round"
          strokeDasharray={`${trackLength} ${circumference}`}
        />
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={radius}
          fill="none"
          stroke={tokenToCssVar(color)}
          strokeWidth={GAUGE_THICKNESS}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Typography variant="h2" className="font-bold leading-none">
          {scorePct}
        </Typography>
        <Typography variant="paragraph-mini" color="muted">
          of 100
        </Typography>
      </div>
    </div>
  )
}
