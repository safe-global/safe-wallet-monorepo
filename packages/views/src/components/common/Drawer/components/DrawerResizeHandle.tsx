import { useRef, type ReactElement } from 'react'

const KEY_STEP = 40

export type DrawerResizeHandleProps = {
  /** The panel's current width in px. */
  width: number
  min: number
  max: number
  onResize: (width: number) => void
}

/** Drag the panel's left edge, or focus it and use the arrow keys, to change its width. */
export const DrawerResizeHandle = ({ width, min, max, onResize }: DrawerResizeHandleProps): ReactElement => {
  const drag = useRef<{ x: number; width: number } | null>(null)
  const clamp = (next: number) => Math.round(Math.max(min, Math.min(next, max)))

  return (
    <div
      role="separator"
      aria-label="Resize panel"
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      className="group/resize absolute inset-y-0 left-0 z-10 w-3 cursor-ew-resize touch-none outline-none"
      onPointerDown={(event) => {
        if (event.button !== 0) return
        drag.current = { x: event.clientX, width }
        event.currentTarget.setPointerCapture?.(event.pointerId)
        event.preventDefault()
      }}
      onPointerMove={(event) => {
        if (drag.current) onResize(clamp(drag.current.width + drag.current.x - event.clientX))
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        onResize(clamp(width + (event.key === 'ArrowLeft' ? KEY_STEP : -KEY_STEP)))
      }}
    >
      <span
        aria-hidden
        className="absolute top-[calc(50%-24px)] left-1 h-12 w-1 rounded-full bg-border transition-colors group-hover/resize:bg-muted-foreground group-focus-visible/resize:bg-muted-foreground"
      />
    </div>
  )
}
