import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type CopyStatus = 'idle' | 'copied' | 'disabled'

export type CopyTooltipViewProps = {
  status: CopyStatus
  initialToolTipText?: string
  showTooltip: boolean
  onShowTooltipChange: (open: boolean) => void
  onCopy: (e: SyntheticEvent) => void
  dialog?: ReactNode
  children?: ReactNode
}

const STATUS_TEXT: Record<Exclude<CopyStatus, 'idle'>, string> = {
  copied: 'Copied',
  disabled: 'Copying is disabled in your browser',
}

export function CopyTooltipView({
  status,
  initialToolTipText = 'Copy to clipboard',
  showTooltip,
  onShowTooltipChange,
  onCopy,
  dialog,
  children,
}: CopyTooltipViewProps): ReactElement {
  const tooltipText = status === 'idle' ? initialToolTipText : STATUS_TEXT[status]

  return (
    <>
      <Tooltip open={showTooltip} onOpenChange={onShowTooltipChange}>
        {/* The tooltip alone is not an accessible name — keep the copy affordance labelled. */}
        <TooltipTrigger
          render={<span className="inline-flex cursor-pointer" aria-label={initialToolTipText} onClick={onCopy} />}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
      {dialog}
    </>
  )
}
