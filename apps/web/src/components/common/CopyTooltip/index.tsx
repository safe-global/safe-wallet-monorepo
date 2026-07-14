import type { ReactNode } from 'react'
import React, { type ReactElement, type SyntheticEvent, useCallback, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ConfirmCopyModal from './ConfirmCopyModal'

const CopyTooltip = ({
  text,
  children,
  initialToolTipText = 'Copy to clipboard',
  onCopy,
  dialogContent,
}: {
  text: string
  children?: ReactNode
  initialToolTipText?: string
  onCopy?: () => void
  dialogContent?: ReactElement
}): ReactElement => {
  const [tooltipText, setTooltipText] = useState(initialToolTipText)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isCopyEnabled, setIsCopyEnabled] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCopy = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (dialogContent && !showConfirmation) {
        setShowConfirmation(true)
        return
      }
      let timeout: NodeJS.Timeout | undefined

      try {
        navigator.clipboard.writeText(text).then(() => setTooltipText('Copied'))
        setShowConfirmation(false)
        setShowTooltip(true)
        timeout = setTimeout(() => {
          if (isCopyEnabled) {
            setShowTooltip(false)
            setTooltipText(initialToolTipText)
          }
        }, 750)
        onCopy?.()
      } catch (err) {
        setIsCopyEnabled(false)
        setTooltipText('Copying is disabled in your browser')
      }

      return () => clearTimeout(timeout)
    },
    [dialogContent, showConfirmation, text, onCopy, isCopyEnabled, initialToolTipText],
  )

  return (
    <>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger render={<span className="inline-flex cursor-pointer" onClick={handleCopy} />}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
      {dialogContent !== undefined && (
        <ConfirmCopyModal onClose={() => setShowConfirmation(false)} onCopy={handleCopy} open={showConfirmation}>
          {dialogContent}
        </ConfirmCopyModal>
      )}
    </>
  )
}

export default CopyTooltip
