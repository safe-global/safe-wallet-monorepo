import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  ariaLabel?: string
  children?: ReactNode
}

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
