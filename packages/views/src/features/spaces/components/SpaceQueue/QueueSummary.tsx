import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_HINT_CLASS, QUEUE_TRIGGER_FOCUS } from './QueueHint'

type QueueSummaryProps = {
  /** What the transaction does; it truncates on the row */
  children: ReactNode
  /** More about it: the network it goes to, the order type, what a rejection does */
  hint?: ReactNode
  defaultOpen?: boolean
}

/** What a transaction does. Long methods and amounts truncate, so the tooltip always has the full text. */
const QueueSummary = ({ children, hint, defaultOpen }: QueueSummaryProps): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger
      render={
        <span
          data-testid="queue-summary"
          tabIndex={0}
          className={`block min-w-0 truncate focus-visible:ring-inset ${QUEUE_TRIGGER_FOCUS}`}
        />
      }
    >
      {children}
    </TooltipTrigger>
    <TooltipContent className={QUEUE_HINT_CLASS}>
      <span className="block break-words font-medium">{children}</span>
      {hint && <span className="mt-1 block">{hint}</span>}
    </TooltipContent>
  </Tooltip>
)

export default QueueSummary
