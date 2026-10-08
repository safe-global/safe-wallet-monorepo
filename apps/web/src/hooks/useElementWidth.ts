import { useEffect, useRef, useState, type RefObject } from 'react'

/** Measures an element's width; `null` until measured, and always where ResizeObserver is missing (jsdom). */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number | null] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
