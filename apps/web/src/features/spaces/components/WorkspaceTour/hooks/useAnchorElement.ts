import { useEffect, useState } from 'react'

export const ANCHOR_TIMEOUT_MS = 5000

const WATCHED_ATTRIBUTES = ['aria-selected', 'data-testid', 'hidden']

type AnchorState = {
  element: Element | null
  isMissing: boolean
}

export const useAnchorElement = (selector?: string): AnchorState => {
  const [element, setElement] = useState<Element | null>(null)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    if (!selector) return

    // Anchors render after their page's data loads and are replaced when tabs switch, so keep following the selector.
    const syncElement = () => setElement(document.querySelector(selector))
    const observer = new MutationObserver(syncElement)
    const timeout = window.setTimeout(() => setHasTimedOut(true), ANCHOR_TIMEOUT_MS)

    syncElement()
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    })

    return () => {
      observer.disconnect()
      window.clearTimeout(timeout)
      setElement(null)
      setHasTimedOut(false)
    }
  }, [selector])

  return { element, isMissing: hasTimedOut && !element }
}
