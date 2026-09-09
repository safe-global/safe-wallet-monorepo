import { useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import RowIconAction from './RowIconAction'

// Copies a safe address. Rows pass a distinct testId so the trigger's `copy-address-btn` stays unambiguous.
// Tracking-agnostic: pass `onCopy` to fire an analytics event labelled for the call site's surface.
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
