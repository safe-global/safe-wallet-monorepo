import { useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import RowIconAction from './RowIconAction'

// Copies a safe address to the clipboard. Used in the dropdown trigger and list rows; the rows pass
// a distinct testId so the trigger's `copy-address-btn` stays a single, unambiguous element.
// Tracking-agnostic: pass `onCopy` to fire an analytics event labelled for the call site's surface
// (the component itself no longer emits sidebar-specific events from the table/dropdown).
const CopyAddressButton = ({
  address,
  testId = 'copy-address-btn',
  onCopy,
}: {
  address: string
  testId?: string
  onCopy?: () => void
}) => {
  const { copied, copy } = useCopyToClipboard()

  const runCopy = useCallback(() => {
    copy(address)
    onCopy?.()
  }, [copy, address, onCopy])

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
