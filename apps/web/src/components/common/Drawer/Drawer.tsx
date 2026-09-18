import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  ariaLabel?: string
  icon?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
}

/**
 * Right-side slide-over panel. Owns the sheet chrome, header layout and close button so call sites
 * only supply content. The body never scrolls on its own — the child owns its scroll area.
 */
export const Drawer = ({
  open,
  onClose,
  size = 'md',
  ariaLabel,
  icon,
  title,
  subtitle,
  action,
  children,
}: DrawerProps): ReactElement => (
  <Sheet
    open={open}
    onOpenChange={(isOpen) => {
      if (!isOpen) onClose()
    }}
  >
    <SheetContent
      side="right"
      size={size}
      variant="floating"
      surface="muted"
      padding="none"
      showCloseButton={false}
      aria-label={ariaLabel}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          {(icon || title || subtitle) && (
            <div className="flex min-w-0 items-center gap-3">
              {icon}
              <div className="min-w-0 leading-tight">
                {title && (
                  <Typography variant="paragraph-small-bold" className="truncate leading-tight">
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <div className="flex items-center gap-1 text-xs leading-none text-muted-foreground">{subtitle}</div>
                )}
              </div>
            </div>
          )}

          <Button variant="surface" size="icon" onClick={onClose} aria-label="Close" className="ml-auto">
            <X />
          </Button>
        </div>

        <div className={cn('flex min-h-0 flex-1 flex-col px-6', !action && 'pb-6')}>{children}</div>

        {action && <div className="px-6 pb-6">{action}</div>}
      </div>
    </SheetContent>
  </Sheet>
)
