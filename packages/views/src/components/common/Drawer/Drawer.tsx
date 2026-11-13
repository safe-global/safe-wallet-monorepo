import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Sheet, SheetContent } from '@safe-global/views/components/ui/sheet'
import styles from './Drawer.module.css'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  resizable?: boolean
  mobileFullScreen?: boolean
  ariaLabel?: string
  /** Extra header buttons, placed left of the expand and close buttons. */
  headerActions?: (state: { fullScreen: boolean }) => ReactNode
  /** Replaces the built-in expand, header action and close buttons with a header that owns them. */
  header?: (controls: { fullScreen: boolean; toggleFullScreen?: () => void; close: () => void }) => ReactNode
  children?: ReactNode
}

export const Drawer = ({
  open,
  onClose,
  size = 'md',
  resizable = false,
  mobileFullScreen = false,
  ariaLabel,
  headerActions,
  header,
  children,
}: DrawerProps): ReactElement => {
  const [width, setWidth] = useState(size === 'lg' ? 700 : 440)
  const [fullScreen, setFullScreen] = useState(false)
  const [availableWidth, setAvailableWidth] = useState<number>()
  const isMobile = useIsMobile()
  const mobileSurface = mobileFullScreen && isMobile
  const expanded = fullScreen || mobileSurface
  const drag = useRef<{ x: number; width: number } | null>(null)
  useEffect(() => {
    if (!open) {
      drag.current = null
      setFullScreen(false)
    }
  }, [open])
  useEffect(() => {
    if (!resizable) return
    const updateViewport = () => setAvailableWidth(Math.max(0, window.innerWidth - 24))
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [resizable])
  const displayedWidth = Math.min(width, availableWidth ?? width)
  const resize = (next: number) => {
    const maximum = Math.max(0, window.innerWidth - 24)
    setWidth(Math.max(Math.min(360, maximum), Math.min(next, maximum)))
  }
  const close = () => {
    drag.current = null
    setFullScreen(false)
    onClose()
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) close()
      }}
    >
      <SheetContent
        side="right"
        size={expanded ? 'auto' : size}
        variant={expanded ? 'default' : 'floating'}
        surface="muted"
        padding="none"
        showCloseButton={false}
        aria-label={ariaLabel}
        className={
          mobileSurface ? `${styles.fullScreen} ${styles.mobileFullScreen}` : expanded ? styles.fullScreen : undefined
        }
        data-mobile-full-screen={mobileSurface || undefined}
        style={resizable && !expanded ? { width: `min(${width}px, calc(100vw - 24px))` } : undefined}
      >
        {resizable && !expanded && (
          <div
            role="separator"
            aria-label="Resize panel"
            aria-orientation="vertical"
            aria-valuemin={Math.min(360, availableWidth ?? 360)}
            aria-valuemax={availableWidth}
            aria-valuenow={displayedWidth}
            tabIndex={0}
            className={styles.resizeHandle}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              drag.current = { x: event.clientX, width: displayedWidth }
              event.currentTarget.setPointerCapture(event.pointerId)
              event.preventDefault()
            }}
            onPointerMove={(event) => {
              if (drag.current) resize(drag.current.width + drag.current.x - event.clientX)
            }}
            onPointerUp={() => {
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
            onLostPointerCapture={() => {
              drag.current = null
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                resize(displayedWidth + (event.key === 'ArrowLeft' ? 40 : -40))
              }
            }}
          />
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {header?.({
            fullScreen,
            toggleFullScreen: resizable && !mobileSurface ? () => setFullScreen(!fullScreen) : undefined,
            close,
          })}
          {children}
        </div>

        {!header && resizable && !mobileSurface && (
          <Button
            variant="surface"
            size="icon"
            onClick={() => setFullScreen(!fullScreen)}
            aria-label={fullScreen ? 'Restore panel' : 'Expand to full screen'}
            aria-pressed={fullScreen}
            className="absolute top-6 right-18"
          >
            {fullScreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        )}

        {!header && headerActions && (
          <div
            className={`absolute top-6 flex items-center gap-2 ${resizable && !mobileSurface ? 'right-30' : 'right-18'}`}
          >
            {headerActions({ fullScreen })}
          </div>
        )}

        {/* Positioned by the Drawer rather than the header so every drawer has a close affordance */}
        {!header && (
          <Button variant="surface" size="icon" onClick={close} aria-label="Close" className="absolute top-6 right-6">
            <X />
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
