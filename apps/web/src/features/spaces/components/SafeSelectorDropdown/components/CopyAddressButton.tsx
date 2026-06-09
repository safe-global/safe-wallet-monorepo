import { useState, useCallback, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'

// Copies a safe address to the clipboard. Used in the dropdown trigger and list rows; the rows pass
// a distinct testId so the trigger's `copy-address-btn` stays a single, unambiguous element.
const CopyAddressButton = ({ address, testId = 'copy-address-btn' }: { address: string; testId?: string }) => {
  const [copied, setCopied] = useState(false)

  const runCopy = useCallback(() => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent(OVERVIEW_EVENTS.COPY_ADDRESS, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Copy Address' })
  }, [address])

  // Stop the click from bubbling to the surrounding SelectItem / collapsible trigger (which would
  // switch the safe or expand the row instead of copying).
  const handlePointer = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    runCopy()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    runCopy()
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            onClick={handlePointer}
            onPointerDown={handlePointer}
            onKeyDown={handleKeyDown}
            className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer inline-flex"
            aria-label="Copy address"
            data-testid={testId}
          />
        }
      >
        {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy address'}</TooltipContent>
    </Tooltip>
  )
}

export default CopyAddressButton
