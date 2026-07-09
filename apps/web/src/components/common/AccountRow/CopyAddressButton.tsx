import { useState, useCallback, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import RowIconAction from './RowIconAction'

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

  return (
    <RowIconAction
      label="Copy address"
      tooltip={copied ? 'Copied!' : 'Copy address'}
      testId={testId}
      onActivate={runCopy}
    >
      {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
    </RowIconAction>
  )
}

export default CopyAddressButton
