import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_HINT_CLASS, QueueHintContent } from './QueueHint'

type QueueTypeTagProps = {
  /** The type's or the Safe App's name */
  title: string
  /** What the type means */
  hint?: string
  /** The tag's icon and name */
  children: ReactNode
  defaultOpen?: boolean
}

/** The transaction type: a grey tag on the row, white while the row is hovered. The tooltip says what the type means. */
const QueueTypeTag = ({ title, hint, children, defaultOpen }: QueueTypeTagProps): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger
      render={
        <span
          data-testid="queue-type-tag"
          tabIndex={0}
          role="img"
          aria-label={hint ? `${title}. ${hint}` : title}
          className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm outline-hidden group-hover/transaction:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      }
    >
      {children}
    </TooltipTrigger>
    <TooltipContent className={QUEUE_HINT_CLASS}>
      <QueueHintContent title={title} body={hint} />
    </TooltipContent>
  </Tooltip>
)

export default QueueTypeTag
