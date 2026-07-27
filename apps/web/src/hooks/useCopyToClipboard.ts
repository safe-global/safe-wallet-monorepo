import { useCallback, useEffect, useRef, useState } from 'react'

/** Fire-and-forget clipboard copy with a transient `copied` flag (auto-resets; timer cleared on unmount). */
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
