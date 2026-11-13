import { useEffect, useState } from 'react'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

const toSpotlightRect = (element: Element): SpotlightRect => {
  const { top, left, width, height } = element.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0
  return { top, left, width, height, radius }
}

export const useElementRect = (element: Element | null): SpotlightRect | null => {
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    if (!element) return

    const measure = () => setRect(toSpotlightRect(element))
    const resizeObserver = new ResizeObserver(measure)

    measure()
    resizeObserver.observe(element)
    resizeObserver.observe(document.body)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [element])

  return element ? rect : null
}
