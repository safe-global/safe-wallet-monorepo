import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Clipboard copy with a transient `copied` flag for the "✓ Copied" affordance. Re-copying restarts
 * the reset window; the pending timer is cleared on unmount. Write is fire-and-forget, matching the
 * copy buttons this was extracted from.
 */
const useCopyToClipboard = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), resetMs)
    },
    [resetMs],
  )

  return { copied, copy }
}

export default useCopyToClipboard
