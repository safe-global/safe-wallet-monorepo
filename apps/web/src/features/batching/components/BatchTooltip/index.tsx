import { type ReactElement, useEffect, useRef, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/**
 * Notification tooltip that appears when a transaction is added to the batch.
 * Subscribes to TxEvent.BATCH_ADD and shows a success message anchored to the
 * batch indicator. Renders via portal so it escapes the topbar's stacking
 * context and layers above any open tx modal. Dismisses on any click.
 */
const BatchTooltip = ({ children }: { children: ReactElement }) => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

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
    <>
      <div ref={anchorRef}>{children}</div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent anchor={anchorRef} side="bottom" align="center" sideOffset={8} className="w-auto p-4">
          <div className="flex flex-col items-center gap-2">
            <CircleCheck className="size-[53px] text-[var(--color-success-main)]" />
            <span className="text-base font-bold whitespace-nowrap">Transaction is added to batch</span>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

export default BatchTooltip
