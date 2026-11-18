import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Sheet, SheetContent } from '@safe-global/views/components/ui/sheet'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { cn } from '@safe-global/views/utils/cn'
import { DrawerContext } from '@safe-global/views/components/common/Drawer/components/DrawerContext'
import { DrawerResizeHandle } from '@safe-global/views/components/common/Drawer/components/DrawerResizeHandle'

const WIDTHS = { md: 440, lg: 700 } as const
const MIN_WIDTH = 360
// Matches the floating panel's 12px inset on each side
const VIEWPORT_GUTTER = 24

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  /** Adds an expand button to the header that fills the screen. Phones are always full screen. */
  expandable?: boolean
  /** Adds a drag handle on the left edge. The width resets when the drawer closes. */
  resizable?: boolean
  ariaLabel?: string
  children?: ReactNode
}

export const Drawer = ({
  open,
  onClose,
  size = 'md',
  expandable = false,
  resizable = false,
  ariaLabel,
  children,
}: DrawerProps): ReactElement => {
  const isMobile = useIsMobile()
  const [headerCount, setHeaderCount] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [width, setWidth] = useState<number | null>(null)

  // Reset on the next open, so the layout holds while the drawer slides out
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setExpanded(false)
      setWidth(null)
    }
  }

  const fullScreen = isMobile || expanded
  const showResizeHandle = resizable && !fullScreen
  const maxWidth = typeof window === 'undefined' ? WIDTHS.lg : Math.max(MIN_WIDTH, window.innerWidth - VIEWPORT_GUTTER)
  const currentWidth = Math.min(width ?? WIDTHS[size], maxWidth)
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
        surface="raised"
        padding="none"
        showCloseButton={false}
        aria-label={ariaLabel}
        data-full-screen={fullScreen || undefined}
        style={showResizeHandle && width !== null ? { width } : undefined}
      >
        {showResizeHandle && (
          <DrawerResizeHandle width={currentWidth} min={MIN_WIDTH} max={maxWidth} onResize={setWidth} />
        )}

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
