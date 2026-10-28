import type { ReactElement, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'

// Tooltip look, popover behaviour: a tooltip drops focus on Tab, so its copy and explorer controls were mouse-only.
const contentClassName =
  'w-fit max-w-none gap-0 rounded-md bg-foreground px-3 py-1.5 text-xs text-background ring-0 [&_a]:text-background'

/** Hover opens it as before; Enter, click and tap open it with focus inside, so keyboard and touch users reach the controls. */
const PeerAddressPopover = ({
  trigger,
  triggerLabel,
  triggerClassName,
  children,
}: {
  trigger: ReactNode
  /** Accessible name when `trigger` has no text, e.g. an icon. */
  triggerLabel?: string
  triggerClassName?: string
  children: ReactNode
}): ReactElement => (
  <Popover>
    <PopoverTrigger openOnHover delay={0} aria-label={triggerLabel} className={triggerClassName}>
      {trigger}
    </PopoverTrigger>
    <PopoverContent side="top" sideOffset={8} className={contentClassName}>
      {children}
    </PopoverContent>
  </Popover>
)

export default PeerAddressPopover
