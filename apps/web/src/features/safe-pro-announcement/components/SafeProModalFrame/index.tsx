import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import SafeProHero from '../SafeProHero'

/**
 * The 640px confirmation dialog of Safe Pro: the compact hero on top and a centered body underneath. Without
 * `onOpenChange` the dialog cannot be dismissed. The design carries no close button; pass `showCloseButton` for
 * the notices that need one.
 */
const SafeProModalFrame = ({
  open,
  onOpenChange,
  showCloseButton = false,
  className,
  children,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
  className?: string
  children: ReactNode
}) => (
  <Dialog open={open} onOpenChange={onOpenChange ?? (() => undefined)}>
    <DialogContent size="sm-lg" surface="card" padding="none" showCloseButton={showCloseButton} className={className}>
      <div className="px-1 pt-1">
        <SafeProHero variant="compact" />
        <div className="mt-2 flex flex-col items-center gap-4 px-7 py-4 text-center">{children}</div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProModalFrame
