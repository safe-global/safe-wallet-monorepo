import { useCallback, useEffect, useRef, useState } from 'react'
import { Errors, logError } from '@/services/exceptions'

/** Clipboard copy with a transient `copied` flag (auto-resets; timer cleared on unmount). */
const useCopyToClipboard = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
      } catch (error) {
        // Clipboard access can be denied (permissions / insecure context) — leave `copied` false.
        logError(Errors._110, error)
        return
      }
      setCopied(true)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), resetMs)
    },
    [resetMs],
  )

  return { copied, copy }
}

export default useCopyToClipboard
