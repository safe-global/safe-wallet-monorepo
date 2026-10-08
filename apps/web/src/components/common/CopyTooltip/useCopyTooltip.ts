import { type SyntheticEvent, useCallback, useState } from 'react'
import type { CopyStatus } from '@views/components/common/CopyTooltip/CopyTooltipView'

const useCopyTooltip = ({
  text,
  onCopy,
  needsConfirmation,
}: {
  text: string
  onCopy?: () => void
  needsConfirmation: boolean
}) => {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const [showTooltip, setShowTooltip] = useState(false)
  const [isCopyEnabled, setIsCopyEnabled] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCopy = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (needsConfirmation && !showConfirmation) {
        setShowConfirmation(true)
        return
      }
      let timeout: NodeJS.Timeout | undefined

      try {
        navigator.clipboard.writeText(text).then(() => setStatus('copied'))
        setShowConfirmation(false)
        setShowTooltip(true)
        timeout = setTimeout(() => {
          if (isCopyEnabled) {
            setShowTooltip(false)
            setStatus('idle')
          }
        }, 750)
        onCopy?.()
      } catch (err) {
        setIsCopyEnabled(false)
        setStatus('disabled')
      }

      return () => clearTimeout(timeout)
    },
    [needsConfirmation, showConfirmation, text, onCopy, isCopyEnabled],
  )

  const closeConfirmation = useCallback(() => setShowConfirmation(false), [])

  return { status, showTooltip, setShowTooltip, showConfirmation, closeConfirmation, handleCopy }
}

export default useCopyTooltip
