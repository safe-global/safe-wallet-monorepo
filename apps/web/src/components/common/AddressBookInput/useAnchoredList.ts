import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'

const VIEWPORT_MARGIN = 8
const OFFSET = 4
/** 4 full rows + a partial 5th at the 81px row pitch, plus the sticky group header. */
const MAX_HEIGHT = 400

/**
 * Positions the option list against the input while it renders in a portal.
 *
 * The list is portalled because every `Card` has `overflow-hidden` and clipped it. A portalled
 * element no longer inherits the wrapper's position, so the geometry has to be computed here.
 */
export const useAnchoredList = (anchorRef: RefObject<HTMLElement | null>, isOpen: boolean) => {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const frame = useRef<number>(0)

  const reposition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN
    const above = rect.top - VIEWPORT_MARGIN
    const flip = below < above && below < 240

    setStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(Math.min(flip ? above : below, MAX_HEIGHT), 120),
      ...(flip ? { bottom: window.innerHeight - rect.top + OFFSET } : { top: rect.bottom + OFFSET }),
    })
  }, [anchorRef])

  // Layout effect so the first paint is already in place, not one frame off to the top-left.
  useLayoutEffect(() => {
    if (isOpen) reposition()
    else setStyle({ visibility: 'hidden' })
  }, [isOpen, reposition])

  useEffect(() => {
    if (!isOpen) return

    // Capture phase, so the list follows the input when any ancestor scrolls, not just the window.
    const onChange = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(reposition)
    }
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)

    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
    }
  }, [isOpen, reposition])

  return style
}
