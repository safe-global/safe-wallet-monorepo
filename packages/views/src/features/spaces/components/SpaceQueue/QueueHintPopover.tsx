import type { ReactElement, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { cn } from '@safe-global/views/utils/cn'
import { QUEUE_TOOLTIP_DELAY } from './tooltip'

// The queue tooltip's look, links included, on a popover
const TOOLTIP_LOOK =
  'w-fit gap-0 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-none ring-0 [&_a:not([data-slot=button])]:text-background [&_a:not([data-slot=button])]:underline [&_a:not([data-slot=button])]:decoration-background/60'

type QueueHintPopoverProps = {
  /** The trigger element; not a button, so it needs its own tabIndex */
  trigger: ReactElement
  children: ReactNode
  /** Holds links or buttons, so it opens on click, tap and Enter too and keeps focus inside */
  content: ReactNode
  contentClassName?: string
  defaultOpen?: boolean
}

/** A hint that looks like the queue tooltips but holds actions a keyboard or touch user can reach */
const QueueHintPopover = ({
  trigger,
  children,
  content,
  contentClassName,
  defaultOpen,
}: QueueHintPopoverProps): ReactElement => (
  <Popover defaultOpen={defaultOpen}>
    <PopoverTrigger render={trigger} nativeButton={false} openOnHover delay={QUEUE_TOOLTIP_DELAY}>
      {children}
    </PopoverTrigger>
    <PopoverContent side="top" sideOffset={8} className={cn(TOOLTIP_LOOK, contentClassName)}>
      {content}
    </PopoverContent>
  </Popover>
)

export default QueueHintPopover
