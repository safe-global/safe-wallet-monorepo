import { Popover, PopoverContent } from '@/components/ui/popover'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

type PopupProps = {
  children?: ReactNode
  open?: boolean
  onClose?: () => void
  anchorEl?: Element | null
  /**
   * Defaults to `true`, which restores what MUI's invisible Backdrop gave this popup: background
   * scroll stays locked, outside content is hidden from assistive tech, and the dismissing click is
   * swallowed instead of also activating whatever sits underneath. Base UI cannot combine that with
   * a focus trap — `'trap-focus'` gives the trap and drops the backdrop.
   */
  modal?: ComponentProps<typeof Popover>['modal']
  /** Accepted for backwards compatibility; the anchor element stays mounted via the portal. */
  keepMounted?: boolean
  /** Accepted for backwards compatibility; Base UI manages its own open/close animation. */
  transitionDuration?: number
}

const Popup = ({ children, open, onClose, anchorEl, modal = true }: PopupProps): ReactElement => {
  return (
    <Popover
      open={open}
      modal={modal}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      <PopoverContent
        anchor={anchorEl ?? undefined}
        align="center"
        side="bottom"
        sideOffset={12}
        className="max-h-[calc(100vh-var(--header-height))] w-[454px] overflow-y-auto rounded-3xl"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export default Popup
