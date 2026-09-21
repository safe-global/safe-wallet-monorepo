import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

// Gauge arc spans 270° with a 90° gap centered at the bottom. The SVG is rotated 135°
// so the dash (which natively starts at 3 o'clock and sweeps clockwise) begins at the
// bottom-left and ends at the bottom-right, leaving the gap open at the bottom.
const GAUGE_ARC_FRACTION = 0.75

export type ScoreGaugeSize = 'default' | 'small'

// Per-size layout: the `default` (workspace card) keeps the original look; `small` (report
// drawer) is a thinner, compact gauge with a 12px score and no "of 100" sublabel.
const GAUGE_VARIANTS: Record<
  ScoreGaugeSize,
  { px: number; thickness: number; scoreClassName: string; labelClassName: string }
> = {
  default: { px: 100, thickness: 6, scoreClassName: '', labelClassName: '' },
  small: { px: 56, thickness: 4, scoreClassName: 'text-xs', labelClassName: 'text-[8px] leading-none' },
}

// Converts a MUI palette token path (e.g. "success.main") to its theme CSS var (vars.css),
// so it can be used as an SVG stroke. Plain colors (no dot) are returned untouched.
const tokenToCssVar = (token: string): string =>
  token.includes('.') ? `var(--color-${token.replace(/\./g, '-')})` : token

export const ScoreGauge = ({
  scorePct,
  color,
  size = 'default',
}: {
  scorePct: number
  color: string
  size?: ScoreGaugeSize
}): ReactElement => {
  const { px, thickness, scoreClassName, labelClassName } = GAUGE_VARIANTS[size]
  const radius = (px - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const trackLength = circumference * GAUGE_ARC_FRACTION
  const progressLength = trackLength * (Math.min(Math.max(scorePct, 0), 100) / 100)

  return (
    <div className="relative inline-flex shrink-0">
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="origin-center rotate-[135deg]">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={tokenToCssVar('border.light')}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${trackLength} ${circumference}`}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={tokenToCssVar(color)}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Typography variant="h2" className={cn('font-bold leading-none', scoreClassName)}>
          {scorePct}
        </Typography>
        <Typography variant="paragraph-mini" color="muted" className={labelClassName}>
          of 100
        </Typography>
      </div>
    </div>
  )
}
