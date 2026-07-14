import { Popover, PopoverContent } from '@/components/ui/popover'
import type { ReactElement, ReactNode } from 'react'

type PopupProps = {
  children?: ReactNode
  open?: boolean
  onClose?: () => void
  anchorEl?: Element | null
  /** Accepted for backwards compatibility; the anchor element stays mounted via the portal. */
  keepMounted?: boolean
  /** Accepted for backwards compatibility; Base UI manages its own open/close animation. */
  transitionDuration?: number
}

const Popup = ({ children, open, onClose, anchorEl }: PopupProps): ReactElement => {
  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.()
      }}
    >
      <PopoverContent
        anchor={anchorEl ?? undefined}
        align="center"
        side="bottom"
        className="top-[var(--header-height)] max-h-[calc(100vh-var(--header-height))] w-[454px] overflow-y-auto"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export default Popup
