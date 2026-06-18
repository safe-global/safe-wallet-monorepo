import { useEffect, useState, type RefObject } from 'react'

/**
 * Reports whether an element's text is visually clipped by CSS truncation
 * (`scrollWidth > clientWidth`). Re-measures on element resize and whenever
 * `observedValue` changes, so callers can pass the rendered text to recompute
 * after content updates that don't change the element's box size.
 */
export function useIsTruncated<T extends HTMLElement>(ref: RefObject<T | null>, observedValue?: unknown): boolean {
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => setIsTruncated(element.scrollWidth > element.clientWidth)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, observedValue])

  return isTruncated
}
