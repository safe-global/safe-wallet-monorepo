import { type ReactElement, useEffect, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/**
 * Notification tooltip that appears when a transaction is added to the batch.
 * Subscribes to TxEvent.BATCH_ADD and shows a success message.
 * Dismisses on any click (including clicking the tooltip itself).
 */
const BatchTooltip = ({ children }: { children: ReactElement }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    return txSubscribe(TxEvent.BATCH_ADD, () => setShow(true))
  }, [])

  useEffect(() => {
    if (!show) return
    const dismiss = () => setShow(false)
    document.addEventListener('click', dismiss)
    return () => document.removeEventListener('click', dismiss)
  }, [show])

  return (
    <div className="relative">
      {children}
      {show && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[var(--z-overlay)] rounded-md border border-border bg-popover p-4 shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex flex-col items-center gap-2">
            <CircleCheck className="size-[53px] text-[var(--color-success-main)]" />
            <span className="text-base font-bold whitespace-nowrap">Transaction is added to batch</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchTooltip
