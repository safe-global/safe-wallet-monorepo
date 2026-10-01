import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { PHASE_PRESENTATION, getEtaCopy } from '../copy'
import type { SafenetCheckState } from '../types'
import { useSafenetCheckState } from '../useSafenetCheckState'

export type SafenetQueueChipViewProps = {
  state: SafenetCheckState
  nowMs: number
}

export const SafenetQueueChipView = ({ state, nowMs }: SafenetQueueChipViewProps): ReactElement => {
  const { severity, label, copy, muted } = PHASE_PRESENTATION[state.phase]
  const eta = state.phase === 'checking' ? getEtaCopy(state.etaMs, nowMs) : undefined

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            aria-label={`Safenet check: ${label}${eta ? `, ${eta}` : ''}`}
            data-testid="safenet-queue-chip"
            data-phase={state.phase}
            className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <SeverityIcon severity={severity} muted={muted} />
        <Typography variant="paragraph-mini" color="muted" className="truncate" aria-live="polite">
          {label}
          {eta && ` · ${eta}`}
        </Typography>
      </TooltipTrigger>
      <TooltipContent side="top">{copy}</TooltipContent>
    </Tooltip>
  )
}

/** Per-row Safenet state in the queue. Queued transactions are already signed, so the check exists. */
export const SafenetQueueChip = (): ReactElement | null => {
  const check = useSafenetCheckState('co-signer')
  if (!check || check.state.phase === 'locked') return null

  return <SafenetQueueChipView state={check.state} nowMs={check.nowMs} />
}

export default SafenetQueueChip
