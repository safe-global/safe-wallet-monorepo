import { useCallback, useRef } from 'react'

/**
 * Publishes an element's live height to a CSS variable on `:root`, so styles elsewhere can size or
 * offset against it. A ResizeObserver keeps the value in sync as the element wraps or its content
 * changes, which a hardcoded offset cannot.
 *
 * Returns a callback ref. Binding through the node (rather than a plain ref + effect) means the
 * observer always tracks the live element, and the variable resets to its globals.css default when
 * the element unmounts.
 */
export function useCssHeightVar(cssVar: string) {
  const detachRef = useRef<(() => void) | null>(null)

  return useCallback(
    (node: HTMLElement | null) => {
      detachRef.current?.()
      detachRef.current = null

      // No ResizeObserver (SSR / jsdom): keep the static default from globals.css.
      if (typeof ResizeObserver === 'undefined') return

      const root = document.documentElement
      if (!node) {
        root.style.removeProperty(cssVar)
        return
      }

      const update = () => root.style.setProperty(cssVar, `${node.offsetHeight}px`)
      update()

      const observer = new ResizeObserver(update)
      observer.observe(node)

      detachRef.current = () => {
        observer.disconnect()
        root.style.removeProperty(cssVar)
      }
    },
    [cssVar],
  )
}
