import type { ReactNode } from 'react'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import CopyIcon from '@/public/images/common/copy.svg'
import { Button } from '@/components/ui/button'
import CopyTooltip from '../CopyTooltip'

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
  initialToolTipText = 'Copy to clipboard',
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
        <Button variant="ghost" size="icon-xs" aria-label={initialToolTipText} className={className}>
          {isCopied ? (
            <Check data-testid="copy-btn-check" className="size-4 text-green-600" />
          ) : (
            <CopyIcon data-testid="copy-btn-icon" className="size-4 text-[var(--color-border-main)]" />
          )}
        </Button>
      )}
    </CopyTooltip>
  )
}

export default CopyButton
