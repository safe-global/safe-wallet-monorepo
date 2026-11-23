import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

/** Where a queued transaction stands while this browser signs or executes it */
export type PendingPhase = 'signing' | 'awaitingParent' | 'submitting' | 'processing' | 'relaying' | 'indexing'

/** "m:ss" */
export const formatElapsed = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const SLOW_FEE_HINT = ' The network fee may be too low. Speed up resubmits it with a higher fee.'

/** The tooltip of a pending row. `elapsedMs` is the time since it was submitted, for `processing` */
export const getPendingHint = (phase: PendingPhase, elapsedMs = 0, slowFee = false): string => {
  switch (phase) {
    case 'signing':
      return 'Saving your signature.'
    case 'awaitingParent':
      return 'The parent Safe signs this through its own transaction. The signature counts once the parent Safe executes it.'
    case 'submitting':
      return 'Waiting for the wallet to submit the transaction.'
    case 'processing':
      return `Submitted ${formatElapsed(elapsedMs)} ago and waiting to be included in a block.${slowFee ? SLOW_FEE_HINT : ''}`
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
  /** Time since the transaction was submitted, for `processing` */
  elapsedMs?: number
}

/** Takes the place of a queue row's action button while the transaction is being signed or executed */
const PendingChip = ({ phase, elapsedMs = 0 }: PendingChipProps): ReactElement => {
  const label = phase === 'processing' ? `Processing ${formatElapsed(elapsedMs)}` : LABELS[phase]
  const hint = getPendingHint(phase, elapsedMs)
  // Nothing runs while the parent Safe hasn't executed, so no spinner
  const waiting = phase === 'awaitingParent'

  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            data-testid="queue-row-pending-chip"
            className="flex rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        }
        aria-label={`${label}. ${hint}`}
      >
        <Badge variant={waiting ? 'warning' : 'info'} size="status" shape="status" className="tabular-nums">
          {!waiting && <Spinner aria-hidden="true" />}
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

export default PendingChip
