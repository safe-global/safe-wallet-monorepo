import { type ReactElement, useEffect, type SyntheticEvent } from 'react'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'
import { ConfirmCopyModalView } from '@views/components/common/CopyTooltip/ConfirmCopyModalView'

export type ConfirmCopyModalProps = {
  open: boolean
  onClose: () => void
  onCopy: { (e: SyntheticEvent): void }
  children: ReactElement
}

const ConfirmCopyModal = ({ open, onClose, onCopy, children }: ConfirmCopyModalProps) => {
  useEffect(() => {
    if (open) {
      trackEvent(TX_LIST_EVENTS.COPY_WARNING_SHOWN)
    }
  }, [open])

  return (
    <ConfirmCopyModalView open={open} onClose={onClose} onCopy={onCopy}>
      {children}
    </ConfirmCopyModalView>
  )
}

export default ConfirmCopyModal
