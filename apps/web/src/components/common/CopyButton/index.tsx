import type { ReactNode } from 'react'
import React, { type ReactElement } from 'react'
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

const CopyButton = ({
  text,
  className,
  children,
  initialToolTipText = 'Copy to clipboard',
  onCopy,
  dialogContent,
}: ButtonProps): ReactElement => {
  return (
    <CopyTooltip text={text} onCopy={onCopy} initialToolTipText={initialToolTipText} dialogContent={dialogContent}>
      {children ?? (
        <Button variant="ghost" size="icon-sm" aria-label={initialToolTipText} className={className}>
          <CopyIcon data-testid="copy-btn-icon" className="size-5 text-[var(--color-border-main)]" />
        </Button>
      )}
    </CopyTooltip>
  )
}

export default CopyButton
