import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Sheet, SheetContent } from '@safe-global/views/components/ui/sheet'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { cn } from '@safe-global/views/utils/cn'
import { DrawerContext } from '@safe-global/views/components/common/Drawer/components/DrawerContext'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  /** Adds an expand button to the header that fills the screen. Phones are always full screen. */
  expandable?: boolean
  ariaLabel?: string
  children?: ReactNode
}

export const Drawer = ({
  open,
  onClose,
  size = 'md',
  expandable = false,
  ariaLabel,
  children,
}: DrawerProps): ReactElement => {
  const isMobile = useIsMobile()
  const [headerCount, setHeaderCount] = useState(0)
  const [expanded, setExpanded] = useState(false)

  if (!open && expanded) setExpanded(false)

  const fullScreen = isMobile || expanded
  const canExpand = expandable && !isMobile

  const registerHeader = useCallback(() => {
    setHeaderCount((count) => count + 1)
    return () => setHeaderCount((count) => count - 1)
  }, [])

  const toggleFullScreen = useCallback(() => setExpanded((value) => !value), [])

  const context = useMemo(
    () => ({ onClose, registerHeader, fullScreen, toggleFullScreen: canExpand ? toggleFullScreen : undefined }),
    [onClose, registerHeader, fullScreen, canExpand, toggleFullScreen],
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen, details) => {
        if (isOpen) return
        // Escape steps back out of full screen first, then closes
        if (expanded && details.reason === 'escape-key') {
          setExpanded(false)
          return
        }
        onClose()
      }}
    >
      <SheetContent
        side="right"
        size={fullScreen ? 'full' : size}
        variant={fullScreen ? 'default' : 'floating'}
        surface="muted"
        padding="none"
        showCloseButton={false}
        aria-label={ariaLabel}
        data-full-screen={fullScreen || undefined}
      >
        <DrawerContext.Provider value={context}>
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden',
              fullScreen &&
                'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
            )}
          >
            {children}
          </div>
        </DrawerContext.Provider>

        {open && headerCount === 0 && (
          <Button variant="surface" size="icon" onClick={onClose} aria-label="Close" className="absolute top-6 right-6">
            <X />
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
