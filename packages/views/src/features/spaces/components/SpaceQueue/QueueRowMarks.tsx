import type { ReactElement } from 'react'
import { TriangleAlert, UserPen } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_HINT_CLASS, QUEUE_TRIGGER_FOCUS, QueueHintContent } from './QueueHint'

/** Marks a transaction no owner has signed yet: a proposer created it */
export const QueueProposerMark = ({
  threshold,
  defaultOpen,
}: {
  threshold: number
  defaultOpen?: boolean
}): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger
      render={
        <span
          tabIndex={0}
          role="img"
          aria-label="Created by a proposer"
          className={`flex shrink-0 text-muted-foreground ${QUEUE_TRIGGER_FOCUS}`}
        />
      }
    >
      <UserPen className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </TooltipTrigger>
    <TooltipContent className={QUEUE_HINT_CLASS}>
      <QueueHintContent
        title="Created by a proposer"
        body={`No owner has signed yet, ${threshold} needed. Sign or reject it to proceed.`}
      />
    </TooltipContent>
  </Tooltip>
)

/** A warning icon after the summary, listing what to check before signing */
export const QueueWarningMarker = ({
  warnings,
  defaultOpen,
}: {
  warnings: string[]
  defaultOpen?: boolean
}): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger
      aria-label={`Warnings: ${warnings.join(', ')}`}
      onClick={(event) => event.stopPropagation()}
      className={`flex shrink-0 items-center text-warning-strong ${QUEUE_TRIGGER_FOCUS}`}
    >
      <TriangleAlert className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
    </TooltipTrigger>
    <TooltipContent>
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </TooltipContent>
  </Tooltip>
)
