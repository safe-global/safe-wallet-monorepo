import { type ReactElement, useEffect, useState } from 'react'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { BatchTooltipView } from '@views/features/batching/components/BatchTooltip/BatchTooltipView'

/**
 * Notification tooltip that appears when a transaction is added to the batch.
 * Subscribes to TxEvent.BATCH_ADD and shows a success message anchored to the
 * batch indicator. Dismisses on any click.
 */
const BatchTooltip = ({ children }: { children: ReactElement }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return txSubscribe(TxEvent.BATCH_ADD, () => setOpen(true))
  }, [])

  useEffect(() => {
    if (!open) return
    const dismiss = () => setOpen(false)
    document.addEventListener('click', dismiss)
    return () => document.removeEventListener('click', dismiss)
  }, [open])

  return (
    <BatchTooltipView open={open} onOpenChange={setOpen}>
      {children}
    </BatchTooltipView>
  )
}

export default BatchTooltip
