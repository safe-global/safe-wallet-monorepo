import { useState, useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'

// Copies a safe address to the clipboard. Used in the dropdown trigger and list rows; the rows pass
// a distinct testId so the trigger's `copy-address-btn` stays a single, unambiguous element.
const CopyAddressButton = ({ address, testId = 'copy-address-btn' }: { address: string; testId?: string }) => {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const runCopy = useCallback(() => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
    trackEvent(OVERVIEW_EVENTS.COPY_ADDRESS, { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Copy Address' })
  }, [address])

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  // pointerdown only blocks the event from reaching the surrounding SelectItem / collapsible trigger
  // (which select the safe or expand the row on pointer down). The copy runs on click, so a pointer
  // click copies exactly once — running it on both would double the clipboard write and analytics
  // event, since preventDefault on pointerdown does not cancel the synthetic click.
  const stopParent = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const handleClick = (e: MouseEvent) => {
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
            onClick={handleClick}
            onPointerDown={stopParent}
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
