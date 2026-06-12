import type { ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { ScanResult } from '@/features/security/types'
import { usePanelHeader } from './hooks/usePanelHeader'

export type PanelHeaderProps = {
  results: Record<string, ScanResult>
  isComplete: boolean
}

// Converts a theme palette token path (e.g. "success.main") to its theme CSS var (vars.css).
// Plain colors / CSS functions (no dot) are returned untouched.
const tokenToCssVar = (color: string): string =>
  color.includes('.') ? `var(--color-${color.replace(/\./g, '-')})` : color

const GAUGE_SIZE = 80
const GAUGE_THICKNESS = 4
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_THICKNESS) / 2
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

/** Score gauge + strength level chip + action line at the top of the panel. */
const PanelHeader = ({ results, isComplete }: PanelHeaderProps): ReactElement | null => {
  const state = usePanelHeader(results, isComplete)

  if (state.status === 'loading') {
    return <Skeleton className="mb-6 h-[120px] rounded-xl" />
  }
  if (state.status === 'empty') return null

  const { score, band, actionLine } = state
  const progressLength = (Math.min(Math.max(score, 0), 100) / 100) * GAUGE_CIRCUMFERENCE

  return (
    <div className="mb-6 rounded-xl p-5" style={{ backgroundColor: tokenToCssVar(band.background) }}>
      <div className="flex flex-row items-center gap-5">
        <div className="relative inline-flex shrink-0">
          <svg
            width={GAUGE_SIZE}
            height={GAUGE_SIZE}
            viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
            className="-rotate-90"
          >
            <circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              fill="none"
              stroke={tokenToCssVar('border.light')}
              strokeWidth={GAUGE_THICKNESS}
            />
            <circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              fill="none"
              stroke={tokenToCssVar(band.color)}
              strokeWidth={GAUGE_THICKNESS}
              strokeLinecap="round"
              strokeDasharray={`${progressLength} ${GAUGE_CIRCUMFERENCE}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="h4" className="font-bold leading-none">
              {score}
            </Typography>
          </div>
        </div>
        <div className="min-w-0">
          <Typography variant="h4" className="mb-0.5 font-bold">
            {band.label}
          </Typography>
          <Typography variant="paragraph-small" className="mb-0.5 leading-normal">
            {band.description}
          </Typography>
          <Typography variant="paragraph-mini" color="muted" className="font-semibold">
            {actionLine}
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default PanelHeader
