import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

/** A hint tooltip's width: the prototype wraps them at 20rem */
export const QUEUE_HINT_CLASS = 'max-w-xs whitespace-normal'

/** The focus ring of a tooltip trigger that isn't a button, so the tooltip opens on keyboard focus too */
export const QUEUE_TRIGGER_FOCUS = 'rounded-sm outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** A hint tooltip's content: a short title, then one sentence */
export const QueueHintContent = ({ title, body }: { title: ReactNode; body?: ReactNode }): ReactElement => (
  <>
    <p className="font-medium">{title}</p>
    {body && <p className="mt-1 leading-relaxed">{body}</p>}
  </>
)

/** A one-line hint on something that isn't focusable itself, such as a status label */
export const QueueTriggerHint = ({
  hint,
  children,
  defaultOpen,
}: {
  hint: string
  children: ReactNode
  defaultOpen?: boolean
}): ReactElement => (
  <Tooltip defaultOpen={defaultOpen}>
    <TooltipTrigger render={<span tabIndex={0} className={`flex ${QUEUE_TRIGGER_FOCUS}`} />}>{children}</TooltipTrigger>
    <TooltipContent>{hint}</TooltipContent>
  </Tooltip>
)
