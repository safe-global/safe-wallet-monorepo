import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Hook to count the number of rendered warning components
 *
 * Warning components may return null when they're not applicable,
 * so we count actual DOM children after render instead of counting
 * React children before render.
 *
 * Uses useLayoutEffect to count synchronously after DOM updates, and
 * MutationObserver to detect when children are added/removed dynamically
 * (e.g., async components rendering after data fetch).
 *
 * @param containerRef - Ref to the container holding warning components
 * @returns The number of rendered (non-null) warnings
 */
export function useWarningCount(containerRef: RefObject<HTMLDivElement | null>): number {
  const [count, setCount] = useState(0)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  // Track when containerRef.current changes
  useLayoutEffect(() => {
    if (containerRef.current !== container) {
      setContainer(containerRef.current)
    }
  })

  useLayoutEffect(() => {
    if (!container) {
      setCount(0)
      return
    }

    // Count direct children that are actually rendered (excludes null returns)
    const updateCount = () => {
      const warnings = container.querySelectorAll(':scope > *')
      const newCount = warnings.length

      setCount((prevCount) => (newCount !== prevCount ? newCount : prevCount))
    }

    // Initial count
    updateCount()

    // Watch for changes to children (e.g., async components rendering after data fetch)
    const observer = new MutationObserver(updateCount)
    observer.observe(container, {
      childList: true, // Watch for children being added/removed
      subtree: false, // Only watch direct children
    })

    return () => {
      observer.disconnect()
    }
  }, [container])

  return count
}
