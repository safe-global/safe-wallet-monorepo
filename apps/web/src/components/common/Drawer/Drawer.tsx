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
  children?: ReactNode
}

/**
 * Right-side slide-over panel. Owns the sheet chrome and the close button; the content is composed
 * from DrawerHeader / DrawerBody / DrawerFooter so each surface can shape its own header.
 */
export const Drawer = ({ open, onClose, size = 'md', ariaLabel, children }: DrawerProps): ReactElement => (
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
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">{children}</div>

      {/* Positioned by the Drawer rather than the header so every drawer has a close affordance */}
      <Button variant="surface" size="icon" onClick={onClose} aria-label="Close" className="absolute top-6 right-6">
        <X />
      </Button>
    </SheetContent>
  </Sheet>
)

/** Header row. Leaves room for the Drawer's close button; push a trailing element with `ml-auto`. */
export const DrawerHeader = ({ className, children }: { className?: string; children?: ReactNode }): ReactElement => (
  <div className={cn('flex items-center gap-3 px-6 pt-6 pr-18', className)}>{children}</div>
)

export const DrawerTitle = ({ size = 'md', children }: { size?: 'md' | 'lg'; children?: ReactNode }): ReactElement => (
  <Typography variant={size === 'lg' ? 'paragraph-bold' : 'paragraph-small-bold'} className="truncate leading-tight">
    {children}
  </Typography>
)

export const DrawerSubtitle = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="flex items-center gap-1 text-xs leading-none text-muted-foreground">{children}</div>
)

/** Scroll owner is the child, not this element — `last:pb-6` drops when a DrawerFooter follows. */
export const DrawerBody = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="flex min-h-0 flex-1 flex-col px-6 last:pb-6">{children}</div>
)

export const DrawerFooter = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className="px-6 pb-6">{children}</div>
)
