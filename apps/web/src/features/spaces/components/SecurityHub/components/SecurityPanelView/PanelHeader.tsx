import type { ReactElement } from 'react'
import { Skeleton } from '@mui/material'
import { Card, CardContent } from '@/components/ui/card'
import type { ScanResult } from '@/features/security/types'
import { getScoreBand } from '../../scoreBands'
import { usePanelHeader } from './hooks/usePanelHeader'

export type PanelHeaderProps = {
  results: Record<string, ScanResult>
  isComplete: boolean
}

/**
 * Score panel at the top of the drawer.
 *
 * Visual model: a quiet shadcn `Card` containing
 *   - the score number (hero) + grade pill (right, dot + label)
 *   - a horizontal progress bar tinted by grade
 *   - the "Security score" anchor + a short action line
 *
 * Replaces the previous tinted card + circular gauge. Reads as a status readout,
 * not an alarm — the color carries enough signal without the saturated background.
 */
const PanelHeader = ({ results, isComplete }: PanelHeaderProps): ReactElement | null => {
  const state = usePanelHeader(results, isComplete)

  if (state.status === 'loading') {
    return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
  }
  if (state.status === 'empty') return null

  const { score, actionLine } = state
  // The numeric score maps to a 5-tier band (label + ramp colors).
  const band = getScoreBand(score)

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold leading-none tabular-nums tracking-tight">{score}</span>
            <span className="text-muted-foreground text-sm tabular-nums">/ 100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: band.color }} aria-hidden />
            <span className="text-sm font-semibold" style={{ color: band.textColor }}>
              {band.label}
            </span>
          </div>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--color-border-light)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${score}%`, backgroundColor: band.color }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Security score"
          />
        </div>
        <div>
          <div className="text-sm font-medium">Security score</div>
          <div className="text-muted-foreground mt-0.5 text-xs">{actionLine}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PanelHeader
