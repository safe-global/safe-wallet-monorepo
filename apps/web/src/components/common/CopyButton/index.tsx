import type { ReactNode } from 'react'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import CopyTooltip from '../CopyTooltip'
import { CopyButtonView } from '@views/components/common/CopyButton/CopyButtonView'

export interface ButtonProps {
  text: string
  className?: string
  children?: ReactNode
  initialToolTipText?: string
  ariaLabel?: string
  onCopy?: () => void
  dialogContent?: ReactElement
}

const RESET_DELAY = 500

const CopyButton = ({
  text,
  className,
  children,
  initialToolTipText,
  onCopy,
  dialogContent,
}: ButtonProps): ReactElement => {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleCopy = useCallback(() => {
    setIsCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsCopied(false), RESET_DELAY)
    onCopy?.()
  }, [onCopy])

  return (
    <CopyTooltip text={text} onCopy={handleCopy} initialToolTipText={initialToolTipText} dialogContent={dialogContent}>
      {children ?? (
        <CopyButtonView isCopied={isCopied} initialToolTipText={initialToolTipText} buttonClassName={className} />
      )}
    </CopyTooltip>
  )
}

export default CopyButton
