import { useCallback } from 'react'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { CopyAddressButtonView } from '@views/components/common/AccountRow/CopyAddressButtonView'

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

  return <CopyAddressButtonView copied={copied} testId={testId} onCopy={runCopy} />
}

export default CopyAddressButton
