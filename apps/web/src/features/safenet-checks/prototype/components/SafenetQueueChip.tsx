import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { cn } from '@/utils/cn'
import { PHASE_PRESENTATION, SAFENET_NAME, isVerdictPhase } from '../copy'
import type { SafenetCheckState } from '../types'
import { useSafenetCheckState } from '../useSafenetCheckState'

export type SafenetQueueChipViewProps = {
  state: SafenetCheckState
}

/** Per-row Safenet state in the queue. A verdict uses body text, not muted, so it reads at a glance. */
export const SafenetQueueChipView = ({ state }: SafenetQueueChipViewProps): ReactElement => {
  const { severity, label, copy, muted } = PHASE_PRESENTATION[state.phase]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            data-testid="safenet-queue-chip"
            data-phase={state.phase}
            className="inline-flex min-w-0 items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <SeverityIcon severity={severity} muted={muted} />
        <Typography
          variant="paragraph-mini"
          className={cn(
            'truncate',
            state.phase === 'risk'
              ? 'text-[var(--color-error-main)]'
              : isVerdictPhase(state.phase)
                ? 'text-foreground'
                : 'text-muted-foreground',
          )}
          aria-live="polite"
        >
          {SAFENET_NAME}: {label}
        </Typography>
      </TooltipTrigger>
      <TooltipContent side="top">
        {SAFENET_NAME}: {copy}
      </TooltipContent>
    </Tooltip>
  )
}

export const SafenetQueueChip = ({ safeTxHash }: { safeTxHash: string }): ReactElement | null => {
  const check = useSafenetCheckState(safeTxHash)
  if (!check || check.state.phase === 'locked' || check.state.phase === 'before-sign') return null

  return <SafenetQueueChipView state={check.state} />
}

export default SafenetQueueChip
