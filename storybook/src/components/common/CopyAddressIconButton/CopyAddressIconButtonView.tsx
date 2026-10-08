import type { KeyboardEvent, ReactElement, SyntheticEvent } from 'react'
import { Copy } from 'lucide-react'
import { cn } from '@/utils/cn'
import { CopyTooltipView, type CopyStatus } from '@views/components/common/CopyTooltip/CopyTooltipView'

export type CopyAddressIconButtonViewProps = {
  className?: string
  status: CopyStatus
  showTooltip: boolean
  onShowTooltipChange: (open: boolean) => void
  onCopy: (e: SyntheticEvent) => void
}

/**
 * Renders a non-`<button>` element so it is safe to nest inside clickable rows (links, collapsible
 * triggers, selection buttons) without invalid button-in-button markup.
 */
export function CopyAddressIconButtonView({
  className,
  status,
  showTooltip,
  onShowTooltipChange,
  onCopy,
}: CopyAddressIconButtonViewProps): ReactElement {
  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  return (
    <CopyTooltipView
      status={status}
      initialToolTipText="Copy address"
      showTooltip={showTooltip}
      onShowTooltipChange={onShowTooltipChange}
      onCopy={onCopy}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="Copy address"
        onKeyDown={handleKeyDown}
        className={cn(
          'text-muted-foreground hover:bg-muted hover:text-foreground inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors',
          className,
        )}
      >
        <Copy className="size-3.5" />
      </span>
    </CopyTooltipView>
  )
}
