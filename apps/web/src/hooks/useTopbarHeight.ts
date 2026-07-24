import { useCallback, useRef } from 'react'

const TOPBAR_HEIGHT_VAR = '--topbar-height'

/**
 * Publishes the topbar's live height to the `--topbar-height` CSS variable so
 * fixed-position overlays — the tx-flow dialog and the Safe Apps frame — sit
 * flush against it at any viewport width. A ResizeObserver keeps it in sync as
 * the header wraps onto extra rows or its content changes, which a hardcoded
 * value cannot: the header is 88px on wide desktop but wraps taller below 1148px.
 *
 * Returns a callback ref for the topbar wrapper. Binding through the node (rather
 * than a plain ref + effect) means the observer always tracks the live element
 * and the variable resets to the globals.css default when the topbar unmounts on
 * header-less routes.
 */
export function useTopbarHeight() {
  const detachRef = useRef<(() => void) | null>(null)

  return useCallback((node: HTMLDivElement | null) => {
    detachRef.current?.()
    detachRef.current = null

    // No ResizeObserver (SSR / jsdom): keep the static default from globals.css.
    if (typeof ResizeObserver === 'undefined') return

    const root = document.documentElement
    if (!node) {
      root.style.removeProperty(TOPBAR_HEIGHT_VAR)
      return
    }

    const update = () => root.style.setProperty(TOPBAR_HEIGHT_VAR, `${node.offsetHeight}px`)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)

    detachRef.current = () => {
      observer.disconnect()
      root.style.removeProperty(TOPBAR_HEIGHT_VAR)
    }
  }, [])
}
