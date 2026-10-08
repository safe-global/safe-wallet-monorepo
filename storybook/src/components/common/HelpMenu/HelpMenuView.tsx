import type { ReactElement } from 'react'
import { HelpCircle, MessageCircle, ExternalLink } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export type HelpMenuViewProps = {
  anchorEl: HTMLElement | null
  onClose: () => void
  showSupport: boolean
  onHelpCenterClick: () => void
  onContactSupportClick: () => void
}

export function HelpMenuView({
  anchorEl,
  onClose,
  showSupport,
  onHelpCenterClick,
  onContactSupportClick,
}: HelpMenuViewProps): ReactElement {
  const isMenuOpen = Boolean(anchorEl)

  return (
    <Popover
      open={isMenuOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <PopoverContent anchor={anchorEl} side="top" align="end" className="w-auto min-w-32 gap-1 p-1">
        <Button
          variant="ghost"
          onClick={onHelpCenterClick}
          // eslint-disable-next-line no-restricted-syntax -- menu-item button: auto height + row padding; pending a menu-item size
          className="h-auto w-full justify-start gap-2 px-3 py-2 font-normal"
        >
          <HelpCircle className="size-4" />
          <span className="flex-1 text-left">Help center</span>
          <ExternalLink className="size-4 text-[var(--color-text-secondary)]" />
        </Button>

        {showSupport ? (
          <Button
            variant="ghost"
            onClick={onContactSupportClick}
            // eslint-disable-next-line no-restricted-syntax -- menu-item button: auto height + row padding; pending a menu-item size
            className="h-auto w-full justify-start gap-2 px-3 py-2 font-normal"
          >
            <MessageCircle className="size-4" />
            <span className="flex-1 text-left">Contact support</span>
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
