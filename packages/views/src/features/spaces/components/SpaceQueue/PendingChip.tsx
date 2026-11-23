import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import { formatTime } from '@safe-global/utils/utils/date'

/** Where a queued transaction stands while this browser signs or executes it */
export type PendingPhase = 'signing' | 'awaitingParent' | 'submitting' | 'processing' | 'relaying' | 'indexing'

/** "m:ss" */
export const formatElapsed = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const SLOW_FEE_HINT = ' The network fee may be too low. Speed up resubmits it with a higher fee.'

/** When a `processing` transaction was submitted, and the time to count from */
export type PendingTiming = { submittedAt: number; now: number }

/** The tooltip of a pending row */
export const getPendingHint = (phase: PendingPhase, timing?: PendingTiming, slowFee = false): string => {
  switch (phase) {
    case 'signing':
      return 'Saving your signature.'
    case 'awaitingParent':
      return 'The parent Safe signs this through its own transaction. The signature counts once the parent Safe executes it.'
    case 'submitting':
      return 'Waiting for the wallet to submit the transaction.'
    case 'processing': {
      const submitted = timing
        ? `Submitted at ${formatTime(timing.submittedAt)} (${formatElapsed(timing.now - timing.submittedAt)} ago)`
        : 'Submitted'
      return `${submitted} and waiting to be included in a block.${slowFee ? SLOW_FEE_HINT : ''}`
    }
    case 'relaying':
      return 'Sent to the relayer and waiting to be included in a block.'
    case 'indexing':
      return 'Included in a block. The queue updates once the transaction is indexed.'
  }
}

const LABELS: Record<Exclude<PendingPhase, 'processing'>, string> = {
  signing: 'Signing',
  awaitingParent: 'Awaiting parent',
  submitting: 'Submitting',
  relaying: 'Relaying',
  indexing: 'Indexing',
}

type PendingChipProps = {
  phase: PendingPhase
  /** For `processing` */
  timing?: PendingTiming
}

/** Takes the place of a queue row's action button while the transaction is being signed or executed */
const PendingChip = ({ phase, timing }: PendingChipProps): ReactElement => {
  const label =
    phase === 'processing' ? `Processing ${formatElapsed(timing ? timing.now - timing.submittedAt : 0)}` : LABELS[phase]
  const hint = getPendingHint(phase, timing)
  // Nothing runs while the parent Safe hasn't executed, so no spinner
  const waiting = phase === 'awaitingParent'

  return (
    <Tooltip delay={QUEUE_TOOLTIP_DELAY}>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            data-testid="queue-row-pending-chip"
            className="flex rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        }
      >
        {/* Read once on focus, not live: the counter would announce every second */}
        <span className="sr-only">{`${label}. ${hint}`}</span>
        <Badge
          aria-hidden="true"
          variant={waiting ? 'warning' : 'info'}
          size="status"
          shape="status"
          className="tabular-nums"
        >
          {!waiting && <Spinner aria-hidden="true" />}
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

export default PendingChip
