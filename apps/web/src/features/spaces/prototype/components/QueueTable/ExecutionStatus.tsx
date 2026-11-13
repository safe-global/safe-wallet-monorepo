import { LoaderCircle } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { formatElapsed, type Execution } from '../../services/execution'
import type { Proposal } from '../../types'
import { HINT_CLASS, HintContent, StatusChip } from '../shared'

const executionHint = (execution: Execution, now: number) =>
  execution.phase === 'indexing'
    ? 'Included in a block. The queue updates once the transaction is indexed.'
    : `Submitted ${formatElapsed(now - execution.startedAt)} ago and waiting to be included in a block.${
        execution.stuck ? ' The network fee may be too low. Speed up resubmits it with a higher fee.' : ''
      }`

// Production's pending states, with the time since it was submitted.
export function ExecutionChip({ execution, now }: { execution: Execution; now: number }) {
  const label = execution.phase === 'indexing' ? 'Indexing' : `Processing ${formatElapsed(now - execution.startedAt)}`
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span />} aria-label={`${label}. ${executionHint(execution, now)}`}>
        <Badge variant={execution.stuck ? 'warning' : 'info'} size="status" shape="status" className="tabular-nums">
          <LoaderCircle className="size-3 animate-spin" strokeWidth={ICON_STROKE} aria-hidden="true" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>{executionHint(execution, now)}</TooltipContent>
    </Tooltip>
  )
}

// A transaction at the nonce of one that is executing can't run, and becomes invalid if that one succeeds.
export function LockedChip({ by }: { by: Proposal }) {
  const hint = `#${by.nonce} is executing another transaction at this nonce. If it succeeds, this one becomes invalid.`
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span />} aria-label={`Locked. ${hint}`}>
        <StatusChip tone="warning">Locked</StatusChip>
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <HintContent title="Waiting for the other transaction" body={hint} />
      </TooltipContent>
    </Tooltip>
  )
}
