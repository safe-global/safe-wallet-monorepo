import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Drives a bottom-fade scroll hint: `showFade` is true only while the attached
 * element overflows and the user hasn't scrolled to the bottom.
 *
 * Attach `setScrollNode` as a callback ref so listeners/observer always bind to
 * the live node (base-ui can remount popup content after sizing it async; a plain
 * ref + effect would stay closed over a stale, detached node). Pass the content
 * signals in `deps` so the hint re-measures when the rendered rows change even if
 * the scroll node itself stays the same.
 */
export function useBottomScrollFade(deps: ReadonlyArray<unknown> = []) {
  const scrollRef = useRef<HTMLElement | null>(null)
  const detachRef = useRef<(() => void) | null>(null)
  const [showFade, setShowFade] = useState(false)

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hasOverflow = el.scrollHeight > el.clientHeight + 1
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowFade(hasOverflow && !atBottom)
  }, [])

  const setScrollNode = useCallback(
    (node: HTMLElement | null) => {
      detachRef.current?.()
      detachRef.current = null
      scrollRef.current = node
      if (!node) return
      node.addEventListener('scroll', measure, { passive: true })
      const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
      resizeObserver?.observe(node)
      Array.from(node.children).forEach((child) => resizeObserver?.observe(child))
      measure()
      const raf = requestAnimationFrame(measure)
      detachRef.current = () => {
        cancelAnimationFrame(raf)
        node.removeEventListener('scroll', measure)
        resizeObserver?.disconnect()
      }
    },
    [measure],
  )

  useEffect(() => {
    measure()
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
    // `deps` is a caller-supplied rest array, so the linter can't statically verify it; `measure` is
    // stable (useCallback with no deps) and re-measuring is idempotent, so spreading deps here is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps])

  return { setScrollNode, showFade }
}
