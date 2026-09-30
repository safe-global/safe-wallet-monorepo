import type { KeyboardEvent } from 'react'
import { Copy } from 'lucide-react'
import CopyTooltip from '../CopyTooltip'
import { cn } from '@/utils/cn'

/**
 * Inline copy-address affordance for account rows/cards. Reuses CopyTooltip for
 * the copy + tooltip logic, and renders a non-`<button>` element so it is safe
 * to nest inside clickable rows (links, collapsible triggers, selection
 * buttons) without invalid button-in-button markup.
 */
const CopyAddressIconButton = ({ address, className }: { address: string; className?: string }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  return (
    <CopyTooltip text={address} initialToolTipText="Copy address">
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
    </CopyTooltip>
  )
}

export default CopyAddressIconButton
