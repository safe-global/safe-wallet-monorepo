import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Sheet, SheetContent } from '@safe-global/views/components/ui/sheet'
import { DrawerContext } from '@safe-global/views/components/common/Drawer/components/DrawerContext'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  ariaLabel?: string
  children?: ReactNode
}

export const Drawer = ({ open, onClose, size = 'md', ariaLabel, children }: DrawerProps): ReactElement => {
  const [headerCount, setHeaderCount] = useState(0)

  const registerHeader = useCallback(() => {
    setHeaderCount((count) => count + 1)
    return () => setHeaderCount((count) => count - 1)
  }, [])

  const context = useMemo(() => ({ onClose, registerHeader }), [onClose, registerHeader])

  return (
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
        <DrawerContext.Provider value={context}>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">{children}</div>
        </DrawerContext.Provider>

        {headerCount === 0 && (
          <Button variant="surface" size="icon" onClick={onClose} aria-label="Close" className="absolute top-6 right-6">
            <X />
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
