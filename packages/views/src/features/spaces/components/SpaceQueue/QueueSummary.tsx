import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_HINT_CLASS, QUEUE_TRIGGER_FOCUS } from './QueueHint'
import QueueHintPopover from './QueueHintPopover'

type QueueSummaryProps = {
  /** What the transaction does; it truncates on the row */
  children: ReactNode
  /** The summary in plain text, when `children` is richer (token logos, bold amounts) */
  label?: ReactNode
  /** More about it: the network it goes to, the order type, what a rejection does */
  hint?: ReactNode
  /** The hint holds a link, so it opens as a popover a keyboard or touch user can reach */
  interactive?: boolean
  defaultOpen?: boolean
}

/** What a transaction does. Long methods and amounts truncate, so the tooltip always has the full text. */
const QueueSummary = ({ children, label, hint, interactive, defaultOpen }: QueueSummaryProps): ReactElement => {
  const trigger = (
    <span
      data-testid="queue-summary"
      tabIndex={0}
      className={`block min-w-0 truncate focus-visible:ring-inset ${QUEUE_TRIGGER_FOCUS}`}
    />
  )
  const content = (
    <>
      <span className="block break-words font-medium">{label ?? children}</span>
      {hint && <span className="mt-1 block">{hint}</span>}
    </>
  )

  if (interactive) {
    return (
      <QueueHintPopover
        trigger={trigger}
        content={content}
        contentClassName={QUEUE_HINT_CLASS}
        defaultOpen={defaultOpen}
      >
        {children}
      </QueueHintPopover>
    )
  }

  return (
    <Tooltip defaultOpen={defaultOpen}>
      <TooltipTrigger render={trigger}>{children}</TooltipTrigger>
      <TooltipContent className={QUEUE_HINT_CLASS}>{content}</TooltipContent>
    </Tooltip>
  )
}

export default QueueSummary
